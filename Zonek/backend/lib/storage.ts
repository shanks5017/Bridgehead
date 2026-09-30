import { v4 as uuidv4 } from 'uuid';
import supabase from './supabase';

const SUPABASE_URL = process.env.SUPABASE_URL!;

/**
 * Upload a buffer to a Supabase Storage bucket.
 * Returns the public CDN URL of the uploaded file.
 *
 * @param bucket      - Storage bucket name (e.g. 'post-images', 'profile-images')
 * @param folder      - Folder path inside bucket (e.g. userId)
 * @param buffer      - File data as Buffer
 * @param contentType - MIME type (e.g. 'image/webp')
 * @param filename    - Optional custom filename; defaults to a UUID-based name
 */
export const uploadToStorage = async (
  bucket: string,
  folder: string,
  buffer: Buffer,
  contentType: string,
  filename?: string
): Promise<string> => {
  const name = filename ?? `${uuidv4()}.webp`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed [${bucket}/${path}]: ${error.message}`);
  }

  return getPublicUrl(bucket, path);
};

/**
 * Delete a file from Supabase Storage by its full path inside the bucket.
 * Silently ignores "not found" errors (idempotent delete).
 *
 * @param bucket - Storage bucket name
 * @param path   - Full path inside bucket (e.g. 'userId/filename.webp')
 */
export const deleteFromStorage = async (bucket: string, path: string): Promise<void> => {
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error && !error.message.includes('not found')) {
    console.error(`Storage delete failed [${bucket}/${path}]:`, error.message);
    // Don't throw — deletion failure should not block other operations
  }
};

/**
 * Extract the storage path from a full Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/profile-images/userId/file.webp"
 *      → "userId/file.webp"
 *
 * Returns null if the URL is not a recognizable Supabase Storage URL.
 */
export const extractStoragePath = (url: string, bucket: string): string | null => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
};

/**
 * Get the public CDN URL for a file in Supabase Storage.
 *
 * @param bucket - Storage bucket name
 * @param path   - Full path inside bucket
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

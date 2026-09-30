import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage, deleteFromStorage, extractStoragePath } from '../lib/storage';

const BUCKET = 'profile-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Image processing presets
const IMAGE_PRESETS = {
  display: { width: 400, height: 400, quality: 85 },
  icon:    { width: 128, height: 128, quality: 80 },
} as const;

type ImageType = 'profile' | 'original';
type PresetKey = keyof typeof IMAGE_PRESETS;

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

const validateImage = (file: Express.Multer.File): void => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`);
  }
  // Magic-byte check
  const sig = file.buffer.slice(0, 4);
  const isJPEG = sig[0] === 0xff && sig[1] === 0xd8;
  const isPNG  = sig[0] === 0x89 && sig[1] === 0x50;
  const isWebP = sig[0] === 0x52 && sig[1] === 0x49;
  if (!isJPEG && !isPNG && !isWebP) {
    throw new Error('File content does not match declared type.');
  }
};

// ---------------------------------------------------------------------------
// PROCESS + UPLOAD ONE PRESET
// ---------------------------------------------------------------------------

const processAndUpload = async (
  buffer: Buffer,
  preset: typeof IMAGE_PRESETS[PresetKey],
  storagePath: string
): Promise<string> => {
  const processed = await sharp(buffer)
    .resize(preset.width, preset.height, { fit: 'cover', position: 'center' })
    .webp({ quality: preset.quality })
    .toBuffer();

  return uploadToStorage(BUCKET, storagePath, processed, 'image/webp');
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Process an uploaded profile image and store both the display and icon sizes
 * in Supabase Storage.
 *
 * @param file             - multer in-memory file
 * @param userId           - owner's UUID (used as the storage folder)
 * @param type             - 'profile' (cropped display) | 'original' (full for re-editing)
 * @param existingImageUrl - current URL to delete before uploading the replacement
 */
export const uploadProfileImage = async (
  file: Express.Multer.File,
  userId: string,
  type: ImageType = 'profile',
  existingImageUrl?: string
): Promise<{ display: string; icon: string }> => {
  validateImage(file);

  // Delete old image if updating
  if (existingImageUrl) {
    const oldPath = extractStoragePath(existingImageUrl, BUCKET);
    if (oldPath) await deleteFromStorage(BUCKET, oldPath);
  }

  const timestamp  = Date.now();
  const uniqueId   = uuidv4().split('-')[0];
  const baseFolder = userId; // files stored under userId/

  const displayFilename = `${type}_${timestamp}_${uniqueId}_display.webp`;
  const iconFilename    = `${type}_${timestamp}_${uniqueId}_icon.webp`;

  const [displayUrl, iconUrl] = await Promise.all([
    processAndUpload(file.buffer, IMAGE_PRESETS.display, `${baseFolder}/${displayFilename}`),
    processAndUpload(file.buffer, IMAGE_PRESETS.icon,    `${baseFolder}/${iconFilename}`),
  ]);

  return { display: displayUrl, icon: iconUrl };
};

/**
 * Delete all profile images for a user (e.g. on account deletion).
 */
export const deleteAllUserProfileImages = async (userId: string): Promise<void> => {
  const { data: files, error } = await (await import('../lib/supabase')).default.storage
    .from(BUCKET)
    .list(userId);

  if (error || !files) return;

  const paths = files.map((f) => `${userId}/${f.name}`);
  if (paths.length === 0) return;

  await (await import('../lib/supabase')).default.storage.from(BUCKET).remove(paths);
};

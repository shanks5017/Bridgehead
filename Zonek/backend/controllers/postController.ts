import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { extractHashtags, toGeographyPoint, applyCursorPagination } from '../lib/query';
import { deleteFromStorage, extractStoragePath } from '../lib/storage';
import { DemandPost, NearbyDemandPost, RentalPost, NearbyRentalPost } from '../types/database.types';

const POST_IMAGES_BUCKET = 'post-images';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Normalise a DB demand row into the shape the frontend expects */
const formatDemandPost = (
  post: (DemandPost | NearbyDemandPost) & { profiles?: any; latitude?: number; longitude?: number }
) => ({
  id: post.id,
  title: post.title,
  category: post.category,
  description: post.description,
  location: {
    latitude: (post as any).latitude ?? null,
    longitude: (post as any).longitude ?? null,
    address: post.address,
  },
  images: post.images ?? [],
  upvotes: post.upvotes,
  phone: post.phone,
  email: post.email,
  openToCollaboration: post.collaboration_open,
  collaborationOpen: post.collaboration_open,
  status: post.status,
  createdBy: (post as any).profiles ?? post.created_by,
  hashtags: post.hashtags ?? [],
  urgencyScore: (post as DemandPost).urgency_score,
  distanceRadiusMiles: (post as DemandPost).distance_radius_miles,
  demographics: (post as DemandPost).demographics ?? [],
  createdAt: post.created_at,
  updatedAt: post.updated_at,
});

/** Normalise a DB rental row into the shape the frontend expects */
const formatRentalPost = (
  post: (RentalPost | NearbyRentalPost) & { profiles?: any; latitude?: number; longitude?: number }
) => ({
  id: post.id,
  title: post.title,
  category: post.category,
  description: post.description,
  location: {
    latitude: (post as any).latitude ?? null,
    longitude: (post as any).longitude ?? null,
    address: post.address,
  },
  images: post.images ?? [],
  price: post.price,
  pricePerSqFtYearly: post.price_per_sqft_yearly,
  squareFeet: post.square_feet,
  leaseType: post.lease_type,
  amenities: post.amenities ?? [],
  zoningCode: post.zoning_code,
  phone: post.phone,
  email: post.email,
  openToCollaboration: post.collaboration_open,
  collaborationOpen: post.collaboration_open,
  status: post.status,
  createdBy: (post as any).profiles ?? post.created_by,
  hashtags: post.hashtags ?? [],
  upvotes: post.upvotes,
  createdAt: post.created_at,
  updatedAt: post.updated_at,
});

// ---------------------------------------------------------------------------
// DEMAND POSTS
// ---------------------------------------------------------------------------

/** GET /api/posts/demands */
export const getDemandPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query;

    if (lat && lng) {
      // Geospatial query via PostGIS RPC
      const radiusM = (parseInt(radius as string) || 5) * 1000;
      const { data, error } = await supabase.rpc('get_nearby_demand_posts', {
        p_lat: parseFloat(lat as string),
        p_lng: parseFloat(lng as string),
        p_radius_m: radiusM,
      });
      if (error) throw error;
      // Enrich with profile data
      const enriched = await enrichPostsWithProfiles(data ?? [], 'created_by');
      res.json(enriched.map(formatDemandPost));
    } else {
      const { data, error } = await supabase
        .from('demand_posts')
        .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json((data ?? []).map(formatDemandPost));
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** POST /api/posts/demands */
export const createDemandPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const userId = req.userId!;

    if (!body.title || !body.category || !body.description) {
      res.status(400).json({ success: false, message: 'title, category, and description are required' });
      return;
    }

    // Resolve location
    let locationWKT: string | null = null;
    let address = '';
    if (body.location) {
      const loc = typeof body.location === 'string' ? { address: body.location } : body.location;
      address = loc.address || '';
      if (loc.latitude && loc.longitude) {
        locationWKT = toGeographyPoint(parseFloat(loc.latitude), parseFloat(loc.longitude));
      }
    }
    if (!address && !locationWKT) {
      res.status(400).json({ success: false, message: 'Location is required' });
      return;
    }

    const images: string[] = req.storageUrls ?? [];
    const hashtags = extractHashtags(body.description);

    const insertPayload: Record<string, any> = {
      title: body.title,
      category: body.category,
      description: body.description,
      address,
      images,
      hashtags,
      created_by: userId,
      collaboration_open: body.collaborationOpen ?? body.openToCollaboration ?? true,
      phone: body.contactPhone ?? body.phone ?? null,
      email: body.contactEmail ?? body.email ?? null,
      urgency_score: body.urgencyScore ?? null,
      distance_radius_miles: body.distanceRadiusMiles ?? null,
      demographics: body.demographics ?? [],
    };

    if (locationWKT) insertPayload.location = locationWKT;

    const { data, error } = await supabase
      .from('demand_posts')
      .insert(insertPayload)
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Demand post created successfully', data: formatDemandPost(data) });
  } catch (error: any) {
    console.error('Create demand post error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create demand post' });
  }
};

/** PUT /api/posts/demands/:id/upvote */
export const upvoteDemandPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if already upvoted
    const { data: existing } = await supabase
      .from('demand_upvotes')
      .select('user_id')
      .eq('demand_post_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Remove upvote
      await supabase.from('demand_upvotes').delete().eq('demand_post_id', id).eq('user_id', userId);
      await supabase.from('demand_posts').update({ upvotes: supabase.rpc('decrement', { x: 1 }) as any }).eq('id', id);
      // Use raw SQL decrement to avoid race conditions
      await supabase.rpc('decrement_demand_upvotes', { post_id: id });
    } else {
      // Add upvote
      await supabase.from('demand_upvotes').insert({ demand_post_id: id, user_id: userId });
      await supabase.rpc('increment_demand_upvotes', { post_id: id });
    }

    const { data, error } = await supabase
      .from('demand_posts')
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(formatDemandPost(data));
  } catch (error: any) {
    console.error('Upvote demand post error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** GET /api/posts/demands/mine */
export const getMyDemandPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('demand_posts')
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .eq('created_by', req.userId!)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data ?? []).map(formatDemandPost));
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** PUT /api/posts/demands/:id */
export const updateDemandPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: post, error: fetchError } = await supabase
      .from('demand_posts')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !post) { res.status(404).json({ message: 'Post not found' }); return; }
    if (post.created_by !== userId) { res.status(403).json({ message: 'Not authorized' }); return; }

    const allowed = ['title', 'category', 'description', 'phone', 'email', 'collaboration_open', 'status'];
    const updates: Record<string, any> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (req.body.openToCollaboration !== undefined) updates.collaboration_open = req.body.openToCollaboration;

    if (updates.description) updates.hashtags = extractHashtags(updates.description);

    const { data, error } = await supabase
      .from('demand_posts')
      .update(updates)
      .eq('id', id)
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .single();

    if (error) throw error;
    res.json(formatDemandPost(data));
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** DELETE /api/posts/demands/:id */
export const deleteDemandPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: post } = await supabase
      .from('demand_posts')
      .select('created_by, images')
      .eq('id', id)
      .single();

    if (!post) { res.status(404).json({ message: 'Post not found' }); return; }
    if (post.created_by !== userId) { res.status(403).json({ message: 'Not authorized' }); return; }

    // Delete associated images from storage
    for (const imgUrl of post.images ?? []) {
      const path = extractStoragePath(imgUrl, POST_IMAGES_BUCKET);
      if (path) await deleteFromStorage(POST_IMAGES_BUCKET, path);
    }

    await supabase.from('demand_posts').delete().eq('id', id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// RENTAL POSTS
// ---------------------------------------------------------------------------

/** GET /api/posts/rentals */
export const getRentalPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query;

    if (lat && lng) {
      const radiusM = (parseInt(radius as string) || 5) * 1000;
      const { data, error } = await supabase.rpc('get_nearby_rental_posts', {
        p_lat: parseFloat(lat as string),
        p_lng: parseFloat(lng as string),
        p_radius_m: radiusM,
      });
      if (error) throw error;
      const enriched = await enrichPostsWithProfiles(data ?? [], 'created_by');
      res.json(enriched.map(formatRentalPost));
    } else {
      const { data, error } = await supabase
        .from('rental_posts')
        .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json((data ?? []).map(formatRentalPost));
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** POST /api/posts/rentals */
export const createRentalPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const userId = req.userId!;

    let locationWKT: string | null = null;
    let address = '';
    if (body.location) {
      const loc = typeof body.location === 'string' ? { address: body.location } : body.location;
      address = loc.address || '';
      if (loc.latitude && loc.longitude) {
        locationWKT = toGeographyPoint(parseFloat(loc.latitude), parseFloat(loc.longitude));
      }
    }

    const images: string[] = req.storageUrls ?? [];
    const hashtags = extractHashtags(body.description ?? '');

    const insertPayload: Record<string, any> = {
      title: body.title,
      category: body.category,
      description: body.description,
      address,
      images,
      hashtags,
      created_by: userId,
      price: body.price ?? 0,
      square_feet: body.squareFeet ?? 0,
      price_per_sqft_yearly: body.pricePerSqFtYearly ?? null,
      lease_type: body.leaseType ?? null,
      amenities: body.amenities ?? [],
      zoning_code: body.zoningCode ?? null,
      phone: body.contactPhone ?? body.phone ?? null,
      email: body.contactEmail ?? body.email ?? null,
      collaboration_open: body.collaborationOpen ?? body.openToCollaboration ?? true,
    };

    if (locationWKT) insertPayload.location = locationWKT;

    const { data, error } = await supabase
      .from('rental_posts')
      .insert(insertPayload)
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .single();

    if (error) throw error;
    res.status(201).json(formatRentalPost(data));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/** PUT /api/posts/rentals/:id/upvote */
export const upvoteRentalPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: existing } = await supabase
      .from('rental_upvotes')
      .select('user_id')
      .eq('rental_post_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('rental_upvotes').delete().eq('rental_post_id', id).eq('user_id', userId);
      await supabase.rpc('decrement_rental_upvotes', { post_id: id });
    } else {
      await supabase.from('rental_upvotes').insert({ rental_post_id: id, user_id: userId });
      await supabase.rpc('increment_rental_upvotes', { post_id: id });
    }

    const { data, error } = await supabase
      .from('rental_posts')
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(formatRentalPost(data));
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** GET /api/posts/rentals/mine */
export const getMyRentalPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('rental_posts')
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .eq('created_by', req.userId!)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data ?? []).map(formatRentalPost));
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** PUT /api/posts/rentals/:id */
export const updateRentalPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: post } = await supabase
      .from('rental_posts')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!post) { res.status(404).json({ message: 'Post not found' }); return; }
    if (post.created_by !== userId) { res.status(403).json({ message: 'Not authorized' }); return; }

    const allowed = ['title', 'category', 'description', 'price', 'square_feet', 'phone', 'email', 'collaboration_open', 'status'];
    const updates: Record<string, any> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (req.body.squareFeet !== undefined) updates.square_feet = req.body.squareFeet;
    if (req.body.openToCollaboration !== undefined) updates.collaboration_open = req.body.openToCollaboration;
    if (updates.description) updates.hashtags = extractHashtags(updates.description);

    const { data, error } = await supabase
      .from('rental_posts')
      .update(updates)
      .eq('id', id)
      .select(`*, profiles:created_by (id, username, full_name, profile_picture_url, reputation_score)`)
      .single();

    if (error) throw error;
    res.json(formatRentalPost(data));
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** DELETE /api/posts/rentals/:id */
export const deleteRentalPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: post } = await supabase
      .from('rental_posts')
      .select('created_by, images')
      .eq('id', id)
      .single();

    if (!post) { res.status(404).json({ message: 'Post not found' }); return; }
    if (post.created_by !== userId) { res.status(403).json({ message: 'Not authorized' }); return; }

    for (const imgUrl of post.images ?? []) {
      const path = extractStoragePath(imgUrl, POST_IMAGES_BUCKET);
      if (path) await deleteFromStorage(POST_IMAGES_BUCKET, path);
    }

    await supabase.from('rental_posts').delete().eq('id', id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// INTERNAL HELPER
// ---------------------------------------------------------------------------

/**
 * Enrich a list of rows that come from an RPC (which can't do joins)
 * with their associated profile data.
 */
const enrichPostsWithProfiles = async (
  rows: any[],
  foreignKey: string
): Promise<any[]> => {
  if (rows.length === 0) return rows;

  const ids = [...new Set(rows.map((r) => r[foreignKey]).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, profile_picture_url, reputation_score')
    .in('id', ids);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row) => ({
    ...row,
    profiles: profileMap.get(row[foreignKey]) ?? null,
  }));
};

// Attach storageUrls type to Express Request
declare global {
  namespace Express {
    interface Request {
      storageUrls?: string[];
    }
  }
}

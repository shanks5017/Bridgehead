import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { extractHashtags, applyCursorPagination } from '../lib/query';
import { CommunityPost, CommunityComment } from '../types/database.types';

interface AuthRequest extends Request {
  user?: any;
}

// ---------------------------------------------------------------------------
// GET FEED (cursor-based pagination)
// ---------------------------------------------------------------------------

/** GET /api/community/posts */
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topic, cursor, limit = '20' } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);

    let query = supabase
      .from('community_posts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (topic && topic !== 'all') {
      query = query.eq('topic', topic as string);
    }

    if (cursor) {
      query = query.lt('created_at', cursor as string);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    const rows = (posts ?? []) as CommunityPost[];

    // Hydrate isLiked for authenticated users — single batch query, no N+1
    let likedPostIds = new Set<string>();
    if (req.user) {
      const postIds = rows.map((p) => p.id);
      if (postIds.length > 0) {
        const { data: interactions } = await supabase
          .from('community_interactions')
          .select('post_id')
          .eq('user_id', req.user.id)
          .eq('type', 'like')
          .in('post_id', postIds);

        (interactions ?? []).forEach((i) => likedPostIds.add(i.post_id));
      }
    }

    const data = rows.map((post) => ({
      ...post,
      is_liked: likedPostIds.has(post.id),
    }));

    const { nextCursor } = applyCursorPagination(data, limitNum);

    res.json({ data, nextCursor });
  } catch (error: any) {
    console.error('Feed error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// CREATE POST
// ---------------------------------------------------------------------------

/** POST /api/community/posts */
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, media, topic } = req.body;
    const user = req.user!;

    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const hashtags = extractHashtags(content);

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        author_name: user.full_name,
        author_username: user.username,
        author_avatar: user.profile_picture_url || null,
        author_badge: user.is_verified_entrepreneur ? 'entrepreneur' : null,
        content,
        media: media ?? null,
        topic: topic ?? 'general',
        hashtags,
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// LIKE / UNLIKE POST
// ---------------------------------------------------------------------------

/** PUT /api/community/posts/:id/like */
export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    // Check for existing like
    const { data: existing } = await supabase
      .from('community_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like')
      .maybeSingle();

    if (existing) {
      // Unlike
      await supabase.from('community_interactions').delete().eq('id', existing.id);
      await supabase
        .from('community_posts')
        .update({ likes_count: supabase.rpc('decrement_community_likes', { post_id: postId }) as any })
        .eq('id', postId);
      await supabase.rpc('decrement_community_likes', { post_id: postId });
      res.json({ message: 'Unliked', isLiked: false });
    } else {
      // Like
      await supabase
        .from('community_interactions')
        .insert({ post_id: postId, user_id: userId, type: 'like' });
      await supabase.rpc('increment_community_likes', { post_id: postId });
      res.json({ message: 'Liked', isLiked: true });
    }
  } catch (error: any) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// REPLY TO POST
// ---------------------------------------------------------------------------

/** POST /api/community/posts/:id/reply */
export const replyToPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const user = req.user!;

    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const { data: comment, error: commentError } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        author_name: user.full_name,
        author_avatar: user.profile_picture_url || null,
        content,
      })
      .select('*')
      .single();

    if (commentError) throw commentError;

    // Increment reply counter atomically
    await supabase.rpc('increment_community_replies', { post_id: postId });

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Reply error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// GET COMMENTS FOR A POST
// ---------------------------------------------------------------------------

/** GET /api/community/posts/:id/comments */
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', req.params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data ?? []);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

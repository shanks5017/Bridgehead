import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { Conversation, Message } from '../types/database.types';

interface AuthRequest extends Request {
  user?: any;
}

// ---------------------------------------------------------------------------
// GET ALL CONVERSATIONS FOR CURRENT USER
// ---------------------------------------------------------------------------

/** GET /api/conversations */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const rows = (conversations ?? []) as Conversation[];

    // Collect all participant IDs (excluding current user)
    const otherParticipantIds = [
      ...new Set(
        rows.flatMap((c) => c.participant_ids.filter((pid) => pid !== userId))
      ),
    ];

    // Batch-fetch participant profiles
    const { data: profiles } = otherParticipantIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name, username, profile_picture_url')
          .in('id', otherParticipantIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Batch-fetch unread counts
    const conversationIds = rows.map((c) => c.id);

    const { data: unreadRows } = conversationIds.length > 0
      ? await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .not('read_by', 'cs', `{${userId}}`)
      : { data: [] };

    const unreadCountMap = new Map<string, number>();
    (unreadRows ?? []).forEach((r) => {
      unreadCountMap.set(r.conversation_id, (unreadCountMap.get(r.conversation_id) ?? 0) + 1);
    });

    const detailed = rows.map((conv) => {
      const otherParticipantId = conv.participant_ids.find((pid) => pid !== userId);
      const participant = otherParticipantId ? profileMap.get(otherParticipantId) : null;

      const role =
        conv.role_context?.owner_id === userId ? 'owner' : 'seeker';

      return {
        id: conv.id,
        postId: conv.post_id ?? null,
        participant: {
          id: participant?.id ?? otherParticipantId,
          name: participant?.full_name ?? 'Unknown',
          avatar: participant?.profile_picture_url ?? null,
          postTitle: (conv.last_message as any)?.post_title ?? 'Direct Message',
        },
        lastMessage: conv.last_message,
        lastMessageTimestamp: (conv.last_message as any)?.timestamp ?? conv.created_at,
        unreadCount: unreadCountMap.get(conv.id) ?? 0,
        role,
        messages: [],
      };
    });

    res.json(detailed);
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// GET MESSAGES FOR A CONVERSATION
// ---------------------------------------------------------------------------

/** GET /api/conversations/:id/messages */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', id)
      .single();

    if (!conv || !conv.participant_ids.includes(userId)) {
      res.status(403).json({ message: 'Not authorized to view this conversation' });
      return;
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, profiles:sender_id (id, full_name, username)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatted = (messages ?? []).map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id === userId ? 'currentUser' : msg.sender_id,
      senderName: msg.profiles?.full_name ?? null,
      text: msg.text,
      media: msg.media,
      timestamp: msg.created_at,
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// CREATE OR GET EXISTING CONVERSATION
// ---------------------------------------------------------------------------

/** POST /api/conversations */
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId, postId } = req.body;
    const userId = req.user!.id;

    if (!targetUserId) {
      res.status(400).json({ message: 'Target user ID is required' });
      return;
    }

    // Check for existing conversation (both participants + optional postId)
    let existingQuery = supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [userId, targetUserId])
      .eq('is_active', true);

    if (postId) {
      existingQuery = existingQuery.eq('post_id', postId);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      res.json({ id: existing.id, isNew: false });
      return;
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        participant_ids: [userId, targetUserId],
        post_id: postId ?? null,
        role_context: { owner_id: targetUserId, seeker_id: userId },
        last_message: {
          text: 'Started a new conversation',
          sender_id: userId,
          timestamp: new Date().toISOString(),
          read: true,
        },
      })
      .select('id')
      .single();

    if (error) throw error;

    res.json({ id: newConv.id, isNew: true });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------------------------------------------------------------------------
// MARK CONVERSATION AS READ
// ---------------------------------------------------------------------------

/** PUT /api/conversations/:id/read */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Use a raw SQL approach to add userId to read_by arrays atomically
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: id,
      p_user_id: userId,
    });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

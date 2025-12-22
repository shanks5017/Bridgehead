import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import DemandPost from '../models/DemandPost';
import mongoose from 'mongoose';

// Extend Request to include user property from middleware
interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get all conversations for current user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId,
            isActive: true
        })
            .populate('participants', 'name profilePicture email') // Populate basic user info
            .populate('postId', 'title') // Populate post title
            .sort({ updatedAt: -1 });

        // Transform data for frontend
        const detailedConversations = await Promise.all(conversations.map(async (conv) => {
            const participant = conv.participants.find((p: any) => p._id.toString() !== userId);

            // Determine role
            let role = 'seeker';
            if (conv.roleContext && conv.roleContext.ownerId) {
                if (conv.roleContext.ownerId.toString() === userId) {
                    role = 'owner';
                }
            }

            // Calculate unread count
            const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                readBy: { $ne: userId }
            });

            return {
                id: conv._id,
                postId: conv.postId ? (conv.postId as any)._id : null,
                participant: {
                    id: (participant as any)._id,
                    name: (participant as any).name,
                    avatar: (participant as any).profilePicture, // Assuming base64 or URL
                    postTitle: conv.postId ? (conv.postId as any).title : 'Direct Message',
                },
                lastMessageTimestamp: conv.lastMessage?.timestamp || conv.createdAt,
                unreadCount,
                role,
                messages: [] // We don't load full messages in the list view for performance
            };
        }));

        res.json(detailedConversations);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const messages = await Message.find({ conversationId: req.params.id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name');

        // Transform for frontend
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            senderId: msg.sender._id.toString() === req.user.id ? 'currentUser' : msg.sender._id,
            text: msg.content.text,
            media: msg.content.media,
            timestamp: msg.createdAt
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or Get existing conversation
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req: AuthRequest, res: Response) => {
    const { targetUserId, postId } = req.body;
    const userId = req.user.id;

    if (!targetUserId) {
        return res.status(400).json({ message: 'Target user ID is required' });
    }

    try {
        // Check if conversation already exists for this post between these users
        let query: any = {
            participants: { $all: [userId, targetUserId] },
            isActive: true
        };
        if (postId) {
            query.postId = postId;
        }

        let conversation = await Conversation.findOne(query);

        if (conversation) {
            return res.json({ id: conversation._id, isNew: false });
        }

        // Determine roles (Owner vs Seeker)
        // If postId is provided, check who owns the post
        let roleContext = {
            ownerId: targetUserId, // Default assumption: I am contacting them, so they own it
            seekerId: userId
        };

        if (postId) {
            const post = await DemandPost.findById(postId); // Check Demand first
            // If checking RentalPost is needed, add logic here
            if (post) {
                // If I own the post, I am owner
                // (Though usually I wouldn't start a convo with myself, so if I start it, I'm usually the seeker responding to a post)
                // But if I'm contacting a lead... logic holds.
            }
        }

        const newConversation = new Conversation({
            participants: [userId, targetUserId],
            postId: postId || undefined,
            roleContext,
            lastMessage: {
                text: 'Started a new conversation',
                sender: userId,
                timestamp: new Date(),
                read: true
            }
        });

        await newConversation.save();
        res.json({ id: newConversation._id, isNew: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all messages in conversation as read
// @route   PUT /api/conversations/:id/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        await Message.updateMany(
            { conversationId: req.params.id, readBy: { $ne: req.user.id } },
            { $addToSet: { readBy: req.user.id } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

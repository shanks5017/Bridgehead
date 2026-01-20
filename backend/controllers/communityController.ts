import { Request, Response } from 'express';
import CommunityPost from '../models/CommunityPost';
import Interaction from '../models/Interaction';
import CommunityComment from '../models/CommunityComment';
import mongoose from 'mongoose';

// Extend Request
interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get Community Feed (Cursor Pagination)
// @route   GET /api/community/posts
// @access  Public (but customized if Auth)
export const getFeed = async (req: AuthRequest, res: Response) => {
    try {
        const { topic, cursor, limit = 20 } = req.query;
        const limitNum = Math.min(parseInt(limit as string), 50); // Hard cap 50

        // Build Query
        let query: any = { status: 'active' };
        if (topic && topic !== 'all') {
            query.topic = topic;
        }

        // Cursor-based Pagination (Performance: O(1))
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor as string) };
        }

        const posts = await CommunityPost.find(query)
            .sort({ createdAt: -1 }) // Index usage: { topic, createdAt }
            .limit(limitNum)
            .lean();

        // Hydrate "isLiked" for logged-in users
        // Performance: Parallel fetch of Interactions instead of N+1 lookups
        let likedPostIds = new Set<string>();
        if (req.user) {
            const postIds = posts.map(p => p._id);
            const interactions = await Interaction.find({
                userId: req.user.id,
                postId: { $in: postIds },
                type: 'like'
            }).select('postId');

            interactions.forEach(i => likedPostIds.add(i.postId.toString()));
        }

        const data = posts.map(post => ({
            ...post,
            isLiked: likedPostIds.has(post._id.toString())
        }));

        res.json({
            data,
            nextCursor: posts.length === limitNum ? posts[posts.length - 1].createdAt : null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new post
// @route   POST /api/community/posts
// @access  Private
export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const { content, media, topic } = req.body;

        // Denormalization: Store author details on the post itself
        // This avoids complex $lookups during feed reads
        const newPost = new CommunityPost({
            author: req.user.id,
            authorName: req.user.fullName,
            authorAvatar: req.user.avatarUrl, // Virtual or stored
            authorBadge: req.user.verified ? 'entrepreneur' : undefined,
            content,
            media,
            topic
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle Like on a post
// @route   PUT /api/community/posts/:id/like
// @access  Private
export const likePost = async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // Check if already liked
        const existingInteraction = await Interaction.findOne({ postId, userId, type: 'like' });

        if (existingInteraction) {
            // Unlike
            await Interaction.deleteOne({ _id: existingInteraction._id });
            await CommunityPost.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
            return res.json({ message: 'Unliked', isLiked: false });
        } else {
            // Like
            await Interaction.create({ postId, userId, type: 'like' });
            await CommunityPost.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
            return res.json({ message: 'Liked', isLiked: true });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reply to a post
// @route   POST /api/community/posts/:id/reply
// @access  Private
export const replyToPost = async (req: AuthRequest, res: Response) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;

        // Create Comment
        const newComment = new CommunityComment({
            postId,
            author: req.user.id,
            authorName: req.user.fullName, // Denormalized
            authorAvatar: req.user.avatarUrl,
            content
        });

        await newComment.save();

        // Increment Post Reply Counter
        await CommunityPost.findByIdAndUpdate(postId, { $inc: { repliesCount: 1 } });

        res.status(201).json(newComment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Comments for a post
// @route   GET /api/community/posts/:id/comments
// @access  Public
export const getComments = async (req: Request, res: Response) => {
    try {
        const comments = await CommunityComment.find({
            postId: req.params.id,
            status: 'active'
        })
            .sort({ createdAt: 1 }); // Oldest first (chronological)

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

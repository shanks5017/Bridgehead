import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
    author: mongoose.Types.ObjectId;
    // Denormalized Author Data (Future-proofing & Performance)
    authorName: string;
    authorAvatar?: string;
    authorBadge?: 'entrepreneur' | 'investor' | 'expert';

    content: string;
    media?: {
        type: 'image' | 'video';
        url: string;
        fileId?: mongoose.Types.ObjectId;
    }[];
    topic: string; // 'startups', 'events', 'general', etc.

    // Atomic Counters (Scalability)
    likesCount: number;
    repliesCount: number;
    repostsCount: number;

    // Moderation
    status: 'active' | 'deleted' | 'flagged';

    createdAt: Date;
    updatedAt: Date;
}

const CommunityPostSchema: Schema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        authorAvatar: { type: String },
        authorBadge: { type: String },

        content: {
            type: String,
            required: true,
            maxlength: 1000,
            trim: true
        },
        media: [
            {
                type: { type: String, enum: ['image', 'video'] },
                url: { type: String, required: true },
                fileId: { type: Schema.Types.ObjectId },
            },
        ],
        topic: { type: String, default: 'general', index: true },

        likesCount: { type: Number, default: 0 },
        repliesCount: { type: Number, default: 0 },
        repostsCount: { type: Number, default: 0 },

        status: {
            type: String,
            enum: ['active', 'deleted', 'flagged'],
            default: 'active'
        }
    },
    { timestamps: true }
);

// Indexes for Feed Performance
CommunityPostSchema.index({ topic: 1, createdAt: -1 }); // Filtered Feed
CommunityPostSchema.index({ createdAt: -1 }); // Global Feed
CommunityPostSchema.index({ author: 1, createdAt: -1 }); // Profile Feed

export default mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);

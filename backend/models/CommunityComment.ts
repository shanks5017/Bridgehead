import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityComment extends Document {
    postId: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    // Denormalized Author for speed
    authorName: string;
    authorAvatar?: string;

    content: string;
    media?: {
        type: 'image' | 'video';
        url: string;
    }[];

    status: 'active' | 'deleted' | 'flagged';
    createdAt: Date;
    updatedAt: Date;
}

const CommunityCommentSchema: Schema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        authorAvatar: { type: String },

        content: {
            type: String,
            required: true,
            maxlength: 500,
            trim: true
        },
        media: [
            {
                type: { type: String, enum: ['image', 'video'] },
                url: { type: String },
            },
        ],

        status: {
            type: String,
            enum: ['active', 'deleted', 'flagged'],
            default: 'active'
        }
    },
    { timestamps: true }
);

// Index: Fetch comments for a post, sorted by time
CommunityCommentSchema.index({ postId: 1, createdAt: 1 });

export default mongoose.model<ICommunityComment>('CommunityComment', CommunityCommentSchema);

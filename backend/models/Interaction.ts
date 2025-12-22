import mongoose, { Schema, Document } from 'mongoose';

export interface IInteraction extends Document {
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'like' | 'repost';
    createdAt: Date;
}

const InteractionSchema: Schema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['like', 'repost'], required: true },
    },
    { timestamps: true }
);

// Idempotency: A user can only 'like' a specific post once.
InteractionSchema.index({ postId: 1, userId: 1, type: 1 }, { unique: true });

export default mongoose.model<IInteraction>('Interaction', InteractionSchema);

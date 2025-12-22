import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    postId?: mongoose.Types.ObjectId;
    lastMessage?: {
        text: string;
        sender: mongoose.Types.ObjectId;
        timestamp: Date;
        read: boolean;
    };
    isActive: boolean;
    roleContext?: {
        ownerId: mongoose.Types.ObjectId; // User who owns the demand/listing
        seekerId: mongoose.Types.ObjectId; // User who responded
    };
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        postId: { type: Schema.Types.ObjectId, ref: 'DemandPost' }, // Could also be RentalPost, but usually id is enough if we infer type or check both
        lastMessage: {
            text: { type: String },
            sender: { type: Schema.Types.ObjectId, ref: 'User' },
            timestamp: { type: Date },
            read: { type: Boolean, default: false },
        },
        isActive: { type: Boolean, default: true },
        roleContext: {
            ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
            seekerId: { type: Schema.Types.ObjectId, ref: 'User' },
        }
    },
    { timestamps: true }
);

// Indexes for fast lookup of a user's deal flow
ConversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);

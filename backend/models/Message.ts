import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content: {
        text?: string;
        media?: {
            type: 'image' | 'video';
            url: string;
            fileId?: mongoose.Types.ObjectId;
        }[];
    };
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: {
            text: { type: String },
            media: [
                {
                    type: { type: String, enum: ['image', 'video'] },
                    url: { type: String, required: true },
                    fileId: { type: Schema.Types.ObjectId }, // Reference to GridFS file
                },
            ],
        },
        readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

// Index for fetching history of a specific conversation
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);

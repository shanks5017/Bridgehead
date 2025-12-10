import { ObjectId } from "mongodb";

export interface IMessage {
  _id?: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  content: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

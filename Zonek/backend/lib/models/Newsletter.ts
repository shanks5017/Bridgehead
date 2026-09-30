import { ObjectId } from "mongodb";

export interface INewsletter {
  _id?: ObjectId;
  email: string;
  subscribedAt: Date;
  active: boolean;
  unsubscribedAt?: Date;
}

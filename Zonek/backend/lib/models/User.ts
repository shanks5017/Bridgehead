import { ObjectId } from "mongodb";

export interface IUser {
  _id?: ObjectId;
  fullName: string;
  email: string;
  password: string; // hashed
  userType: "entrepreneur" | "community-member" | "property-owner";
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse extends Omit<IUser, "password"> {}

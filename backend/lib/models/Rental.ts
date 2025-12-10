import { ObjectId } from "mongodb";

export interface IRental {
  _id?: ObjectId;
  propertyName: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  rentPrice: number;
  propertyType: string;
  description: string;
  owner: ObjectId; // User ID
  contact: {
    phone: string;
    email: string;
  };
  amenities: string[];
  images: string[];
  availableFrom: Date;
  featured: boolean;
  status: "available" | "rented" | "unlisted";
  createdAt: Date;
  updatedAt: Date;
}

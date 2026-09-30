import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  externalId: string; // The ID from JD/Sulekha URL
  source: 'justdial' | 'sulekha';
  name: string;
  url: string;
  phone: string[];
  email?: string;
  website?: string;
  address: string;
  locality: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  rating: number;
  reviewCount: number;
  category: string;
  verified: boolean;
  status: 'active' | 'inactive';
  lastScrapedAt: Date;
  deletedAt?: Date;
  metadata: Record<string, any>;
}

export interface ICoimbatoreAdsListing extends IListing {
  images: string[];
  workingHours?: string;
  ratingCount?: number;
  yearEstablished?: string;
  
  // New Extended Fields
  overview?: string;
  services?: string[];
  quickInfo?: { [key: string]: string[] } | string[];
  priceList?: { name: string; price: string }[];
  reviewsList?: { author: string; rating: number; text: string; date: string }[];
}

export interface IScrapingStatus extends Document {
  cityName: string;
  type: 'list' | 'ads';
  category?: string;
  status: 'pending' | 'in_progress' | 'completed';
  lastScrapedAt: Date;
}

const ListingSchema: Schema = new Schema({
  externalId: { type: String, required: true, unique: true },
  source: { type: String, enum: ['justdial', 'sulekha'], required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  phone: [{ type: String }],
  email: { type: String },
  website: { type: String },
  address: { type: String },
  locality: { type: String },
  pincode: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  category: { type: String, index: true },
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastScrapedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Coimbatore Ads Schema (Completely separate DB collection)
const CoimbatoreAdsSchema: Schema = new Schema({
  externalId: { type: String, required: true, unique: true },
  source: { type: String, enum: ['justdial', 'sulekha'], required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  phone: [{ type: String }],
  email: { type: String },
  website: { type: String },
  address: { type: String },
  locality: { type: String },
  pincode: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  category: { type: String, index: true },
  verified: { type: Boolean, default: false },
  _index: { type: Number, default: 0 },
  _qualityScore: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  
  // Enriched Fields
  images: [{ type: String }],
  workingHours: { type: String },
  ratingCount: { type: Number, default: 0 },
  yearEstablished: { type: String },
  
  // Extended Deep Profile Fields
  overview: { type: String },
  services: [{ type: String }],
  quickInfo: { type: Schema.Types.Mixed },
  priceList: [{ 
    name: { type: String }, 
    price: { type: String } 
  }],
  reviewsList: [{
    author: { type: String },
    rating: { type: Number },
    text: { type: String },
    date: { type: String }
  }],
  
  lastScrapedAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
  // Removed hardcoded collection name to allow dynamic model creation
});

// Scraping Status Schema for tracking progress
const ScrapingStatusSchema: Schema = new Schema({
  cityName: { type: String, required: true },
  type: { type: String, enum: ['list', 'ads'], required: true },
  category: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  lastScrapedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

ScrapingStatusSchema.index({ cityName: 1, type: 1, category: 1 }, { unique: true });

// Primary index for Area-Category atomic search
ListingSchema.index({ locality: 1, category: 1 });
CoimbatoreAdsSchema.index({ locality: 1, category: 1 });

/**
 * Factory to get a Model for a specific city's Raw Listing collection.
 * Pattern: <CityName>_List
 */
export function getListingModel(cityName: string): mongoose.Model<IListing> {
  const modelName = `${cityName}_Listing`;
  const collectionName = `${cityName}_List`;
  
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName] as mongoose.Model<IListing>;
  }
  
  return mongoose.model<IListing>(modelName, ListingSchema, collectionName);
}

/**
 * Factory to get a Model for a specific city's Enriched Ads collection.
 * Pattern: <CityName>_ads
 */
export function getAdsModel(cityName: string): mongoose.Model<ICoimbatoreAdsListing> {
  const modelName = `${cityName}_Ads`;
  const collectionName = `${cityName}_ads`;
  
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName] as mongoose.Model<ICoimbatoreAdsListing>;
  }
  
  return mongoose.model<ICoimbatoreAdsListing>(modelName, CoimbatoreAdsSchema, collectionName);
}

// Backward Compatibility for Coimbatore
export const Listing = getListingModel('Coimbatore');
export const CoimbatoreAds = getAdsModel('Coimbatore');
export const ScrapingStatus = mongoose.model<IScrapingStatus>('ScrapingStatus', ScrapingStatusSchema);

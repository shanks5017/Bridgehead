import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

// Interface for Comment
export interface IComment {
  _id: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
}

// Interface for RentalPost
export interface IRentalPost extends Document {
  title: string;
  category: string;
  description: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  images: string[];
  price: number;
  pricePerSqFtYearly?: number;
  squareFeet: number;
  leaseType?: string;
  amenities?: string[];
  zoningCode?: string;
  phone?: string;
  email?: string;
  collaborationOpen: boolean;
  status: 'available' | 'rented' | 'expired';
  createdBy: Types.ObjectId | IUser;
  comments: IComment[];
  upvotes: number;
  upvotedBy: (Types.ObjectId | IUser)[];
  hashtags: string[];
  createdAt: Date;
  updatedAt: Date;
  addComment: (userId: Types.ObjectId, content: string) => Promise<IComment>;
  toggleUpvote: (userId: Types.ObjectId) => Promise<number>;
}

const LocationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: false,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: false
  },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false });

const CommentSchema = new Schema({
  content: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true, timestamps: true });

const RentalPostSchema = new Schema<IRentalPost>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: LocationSchema, required: true },
  images: [{ type: String }],
  price: { type: Number, required: true },
  pricePerSqFtYearly: { type: Number },
  squareFeet: { type: Number, required: true },
  leaseType: { type: String },
  amenities: [{ type: String }],
  zoningCode: { type: String },
  phone: { type: String },
  email: { type: String },
  collaborationOpen: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['available', 'rented', 'expired'],
    default: 'available'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  comments: [CommentSchema],
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  hashtags: [{ type: String, index: true }]
}, {
  timestamps: true,
  collection: 'rentals',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
RentalPostSchema.index({ location: '2dsphere' });

// Add text index for search
RentalPostSchema.index({
  title: 'text',
  description: 'text',
  'location.address': 'text'
});



// Pre-save middleware to extract hashtags from description
RentalPostSchema.pre('save', function (next) {
  if (this.isModified('description')) {
    const { extractHashtags } = require('../utils/hashtagUtils');
    this.hashtags = extractHashtags(this.description);
  }
  next();
});

// Virtual for comment count
RentalPostSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// Method to add a comment
RentalPostSchema.methods.addComment = async function (userId: Types.ObjectId, content: string) {
  const comment = {
    _id: new Types.ObjectId(),
    content,
    createdBy: userId,
    createdAt: new Date()
  };

  this.comments.push(comment);
  await this.save();

  // Add to user's comments
  await mongoose.model('User').findByIdAndUpdate(userId, {
    $push: { comments: this._id }
  });

  return comment;
};

// Method to toggle upvote
RentalPostSchema.methods.toggleUpvote = async function (userId: Types.ObjectId) {
  const userIndex = this.upvotedBy.indexOf(userId);
  const User = mongoose.model('User');

  if (userIndex === -1) {
    // Add upvote
    this.upvotedBy.push(userId);
    this.upvotes += 1;

    // Add to user's upvoted posts
    await User.findByIdAndUpdate(userId, {
      $addToSet: { upvotedRentalPosts: this._id }
    });
  } else {
    // Remove upvote
    this.upvotedBy.splice(userIndex, 1);
    this.upvotes = Math.max(0, this.upvotes - 1);

    // Remove from user's upvoted posts
    await User.findByIdAndUpdate(userId, {
      $pull: { upvotedRentalPosts: this._id }
    });
  }

  await this.save();
  return this.upvotes;
};

const RentalPost = mongoose.model<IRentalPost>('RentalPost', RentalPostSchema);

export default RentalPost;
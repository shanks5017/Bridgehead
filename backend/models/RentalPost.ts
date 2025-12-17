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
  squareFeet: number;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
  status: 'available' | 'rented' | 'expired';
  createdBy: Types.ObjectId | IUser;
  comments: IComment[];
  upvotes: number;
  upvotedBy: (Types.ObjectId | IUser)[];
  createdAt: Date;
  updatedAt: Date;
  addComment: (userId: Types.ObjectId, content: string) => Promise<IComment>;
  toggleUpvote: (userId: Types.ObjectId) => Promise<number>;
}

const LocationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  address: { type: String, required: true }
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
  squareFeet: { type: Number, required: true },
  phone: { type: String },
  email: { type: String },
  openToCollaboration: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['available', 'rented', 'expired'],
    default: 'available'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [CommentSchema],
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true,
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

// Virtual for comment count
RentalPostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to add a comment
RentalPostSchema.methods.addComment = async function(userId: Types.ObjectId, content: string) {
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
RentalPostSchema.methods.toggleUpvote = async function(userId: Types.ObjectId) {
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
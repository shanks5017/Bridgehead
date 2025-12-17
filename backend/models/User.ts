// @ts-nocheck
import mongoose, { Document, Schema, Types, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  userType: 'entrepreneur' | 'community';
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  authProvider: 'email' | 'google' | 'microsoft';
  authProviderId?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  demandPosts: Types.ObjectId[];
  rentalPosts: Types.ObjectId[];
}

interface IUserModel extends Model<IUser> {
  // Add any static methods here
}

const userSchema = new Schema<IUser>({
  fullName: {
    type: String,
    required: [true, 'Please enter your full name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'microsoft'],
    default: 'email'
  },
  authProviderId: {
    type: String,
    sparse: true,
    index: true
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  demandPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'DemandPost'
  }],
  rentalPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'RentalPost'
  }],
  upvotedDemandPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'DemandPost'
  }],
  upvotedRentalPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'RentalPost'
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });


// Middleware to hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Virtual for user's full profile URL
userSchema.virtual('profileUrl').get(function () {
  return `/api/users/${this._id}`;
});

// Virtual for user's avatar URL
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) {
    return this.avatar.startsWith('http') ? this.avatar : `/uploads/avatars/${this.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.fullName)}&background=random`;
});

// Create and export the model
const User = (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;

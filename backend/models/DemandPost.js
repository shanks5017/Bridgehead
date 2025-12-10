import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
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
  address: { type: String, required: true },
}, { _id: false });

const DemandPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: LocationSchema, required: true },
  images: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  phone: { type: String },
  email: { type: String },
  openToCollaboration: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'createdAt' } // Use 'createdAt' to match frontend type
});

// Index for geospatial queries
DemandPostSchema.index({ location: '2dsphere' });

const DemandPost = mongoose.model('DemandPost', DemandPostSchema);

export default DemandPost;
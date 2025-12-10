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

const RentalPostSchema = new mongoose.Schema({
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
}, {
  timestamps: { createdAt: 'createdAt' } // Use 'createdAt' to match frontend type
});

// Index for geospatial queries
RentalPostSchema.index({ location: '2dsphere' });

const RentalPost = mongoose.model('RentalPost', RentalPostSchema);

export default RentalPost;
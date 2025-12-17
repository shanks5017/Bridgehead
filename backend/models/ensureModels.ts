import mongoose from 'mongoose';
import User from './User';
import DemandPost from './DemandPost';
import RentalPost from './RentalPost';

// This ensures all models are registered with Mongoose
// and can be used with populate() and other Mongoose features
const models = {
  User: mongoose.models.User || User,
  DemandPost: mongoose.models.DemandPost || DemandPost,
  RentalPost: mongoose.models.RentalPost || RentalPost
};

export default models;

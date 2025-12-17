import mongoose from 'mongoose';
import User from './User';
import DemandPost from './DemandPost';
import RentalPost from './RentalPost';

// Register models
const models = {
  User: mongoose.models.User || mongoose.model('User', User.schema),
  DemandPost: mongoose.models.DemandPost || mongoose.model('DemandPost', DemandPost.schema),
  RentalPost: mongoose.models.RentalPost || mongoose.model('RentalPost', RentalPost.schema)
};

export default models;

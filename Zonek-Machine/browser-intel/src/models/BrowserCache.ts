import mongoose from 'mongoose';

/**
 * BROWSER CACHE SCHEMA
 * Stores full research results for 24 hours to avoid redundant API costs.
 */
const browserCacheSchema = new mongoose.Schema({
  queryHash: { type: String, required: true, unique: true, index: true },
  businessType: { type: String, required: true },
  location: { type: String, required: true },
  packet: { type: Object, required: true },
  fetchedAt: { 
    type: Date, 
    default: Date.now, 
    expires: 86400 // 24 hours in seconds
  }
});

export default mongoose.model('BrowserCache', browserCacheSchema);

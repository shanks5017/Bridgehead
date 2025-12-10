import DemandPost from '../models/DemandPost.js';
import RentalPost from '../models/RentalPost.js';

// Helper to parse lat/lng from query params
const parseLocationQuery = (req) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) return null;
  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    maxDistance: (parseInt(radius) || 5) * 1000 // Default 5km, convert to meters
  };
};

// Helper to format post for response
const formatPostResponse = (post) => {
  const postObject = post.toObject();
  postObject.id = postObject._id;

  // Transform GeoJSON back to simple lat/lng for frontend
  if (postObject.location && postObject.location.coordinates) {
    postObject.location = {
      latitude: postObject.location.coordinates[1],
      longitude: postObject.location.coordinates[0],
      address: postObject.location.address
    };
  }

  delete postObject._id;
  delete postObject.__v;
  return postObject;
};

// @desc    Get all demand posts
// @route   GET /api/posts/demands
export const getDemandPosts = async (req, res) => {
  try {
    const locationQuery = parseLocationQuery(req);
    let posts;

    if (locationQuery) {
      posts = await DemandPost.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [locationQuery.longitude, locationQuery.latitude]
            },
            $maxDistance: locationQuery.maxDistance
          }
        }
      });
    } else {
      posts = await DemandPost.find().sort({ createdAt: -1 });
    }

    res.json(posts.map(formatPostResponse));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a demand post
// @route   POST /api/posts/demands
export const createDemandPost = async (req, res) => {
  try {
    const postData = { ...req.body };

    // Transform frontend location to GeoJSON
    if (postData.location && postData.location.latitude && postData.location.longitude) {
      postData.location = {
        type: 'Point',
        coordinates: [postData.location.longitude, postData.location.latitude],
        address: postData.location.address
      };
    }

    const post = new DemandPost(postData);
    const createdPost = await post.save();
    res.status(201).json(formatPostResponse(createdPost));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Upvote a demand post
// @route   PUT /api/posts/demands/:id/upvote
export const upvoteDemandPost = async (req, res) => {
  try {
    const post = await DemandPost.findById(req.params.id);
    if (post) {
      post.upvotes += 1;
      const updatedPost = await post.save();
      res.json(formatPostResponse(updatedPost));
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all rental posts
// @route   GET /api/posts/rentals
export const getRentalPosts = async (req, res) => {
  try {
    const locationQuery = parseLocationQuery(req);
    let posts;

    if (locationQuery) {
      posts = await RentalPost.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [locationQuery.longitude, locationQuery.latitude]
            },
            $maxDistance: locationQuery.maxDistance
          }
        }
      });
    } else {
      posts = await RentalPost.find().sort({ createdAt: -1 });
    }

    res.json(posts.map(formatPostResponse));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a rental post
// @route   POST /api/posts/rentals
export const createRentalPost = async (req, res) => {
  try {
    const postData = { ...req.body };

    // Transform frontend location to GeoJSON
    if (postData.location && postData.location.latitude && postData.location.longitude) {
      postData.location = {
        type: 'Point',
        coordinates: [postData.location.longitude, postData.location.latitude],
        address: postData.location.address
      };
    }

    const post = new RentalPost(postData);
    const createdPost = await post.save();
    res.status(201).json(formatPostResponse(createdPost));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

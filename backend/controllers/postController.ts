// @ts-nocheck
import DemandPost from '../models/DemandPost';
import RentalPost from '../models/RentalPost';

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

    // Validate required fields
    if (!postData.title || !postData.category || !postData.description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, category, and description are required'
      });
    }

    // Add createdBy field from authenticated user
    postData.createdBy = req.userId;

    // Process uploaded images (Custom Native GridFS storage in MongoDB)
    if (req.gridfsFiles && Array.isArray(req.gridfsFiles) && req.gridfsFiles.length > 0) {
      // Store GridFS file IDs as API endpoints
      postData.images = req.gridfsFiles.map((file: any) => {
        // GridFS files have an 'id' property containing the MongoDB ObjectId
        return `/api/images/${file.id}`;
      });
    } else {
      postData.images = [];
    }

    // Transform frontend location to GeoJSON
    if (postData.location) {
      // Support both string address and object with lat/lng
      if (typeof postData.location === 'string') {
        postData.location = {
          type: 'Point',
          coordinates: [0, 0], // Default coordinates if not provided
          address: postData.location
        };
      } else if (postData.location.latitude && postData.location.longitude) {
        postData.location = {
          type: 'Point',
          coordinates: [postData.location.longitude, postData.location.latitude],
          address: postData.location.address || ''
        };
      } else if (postData.location.address) {
        postData.location = {
          type: 'Point',
          coordinates: [0, 0],
          address: postData.location.address
        };
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Rename fields to match schema
    if (postData.contactEmail) {
      postData.email = postData.contactEmail;
      delete postData.contactEmail;
    }
    if (postData.contactPhone) {
      postData.phone = postData.contactPhone;
      delete postData.contactPhone;
    }

    const post = new DemandPost(postData);
    const createdPost = await post.save();

    res.status(201).json({
      success: true,
      message: 'Demand post created successfully',
      data: formatPostResponse(createdPost)
    });
  } catch (error) {
    console.error('Error creating demand post:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create demand post'
    });
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

    // Add createdBy field from authenticated user
    postData.createdBy = req.userId;

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

// @desc    Get current user's demand posts
// @route   GET /api/posts/demands/mine
export const getMyDemandPosts = async (req, res) => {
  try {
    const posts = await DemandPost.find({ createdBy: req.userId }).sort({ createdAt: -1 });
    res.json(posts.map(formatPostResponse));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get current user's rental posts
// @route   GET /api/posts/rentals/mine
export const getMyRentalPosts = async (req, res) => {
  try {
    const posts = await RentalPost.find({ createdBy: req.userId }).sort({ createdAt: -1 });
    res.json(posts.map(formatPostResponse));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a demand post (owner only)
// @route   PUT /api/posts/demands/:id
export const updateDemandPost = async (req, res) => {
  try {
    const post = await DemandPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ownership check
    if (post.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'category', 'description', 'phone', 'email', 'openToCollaboration', 'status'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    const updatedPost = await post.save();
    res.json(formatPostResponse(updatedPost));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a demand post (owner only)
// @route   DELETE /api/posts/demands/:id
export const deleteDemandPost = async (req, res) => {
  try {
    const post = await DemandPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ownership check
    if (post.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a rental post (owner only)
// @route   PUT /api/posts/rentals/:id
export const updateRentalPost = async (req, res) => {
  try {
    const post = await RentalPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ownership check
    if (post.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'category', 'description', 'price', 'squareFeet', 'phone', 'email', 'openToCollaboration', 'status'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    const updatedPost = await post.save();
    res.json(formatPostResponse(updatedPost));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a rental post (owner only)
// @route   DELETE /api/posts/rentals/:id
export const deleteRentalPost = async (req, res) => {
  try {
    const post = await RentalPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ownership check
    if (post.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

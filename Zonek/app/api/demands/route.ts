import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Helper to format demand post
const formatDemandPost = (post: any) => ({
  id: post._id.toString(),
  title: post.title,
  description: post.description,
  category: post.category,
  location: post.location,
  coordinates: post.coordinates || [],
  upvotes: post.upvotes || 0,
  upvotedBy: (post.upvotedBy || []).map((id: ObjectId) => id.toString()),
  createdBy: post.createdBy.toString(),
  createdAt: post.createdAt,
  updatedAt: post.updatedAt
});

export async function POST(req: NextRequest) {
  try {
    // Verify auth token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { title, description, category, location, coordinates } = await req.json();

    if (!title || !description || !category || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(decoded.userId);

    const demand = {
      title,
      description,
      category,
      location,
      coordinates,
      createdBy: userId,
      upvotes: 0,
      upvotedBy: [],
      votes: 0,
      upvotedBy: [],
      status: "active",
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("demands").insertOne(demand);
    const insertedDemand = await db.collection("demands").findOne({ _id: result.insertedId });

    return NextResponse.json(
      formatDemandPost(insertedDemand),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating demand post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5';
    const category = searchParams.get('category');

    const { db } = await connectToDatabase();
    let query: any = {};

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Add location-based query if coordinates are provided
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      };
    }

    const demands = await db
      .collection("demands")
      .find(query)
      .sort({ upvotes: -1, createdAt: -1 })
      .toArray();

    // Format the response
    const formattedDemands = demands.map(formatDemandPost);

    return NextResponse.json(formattedDemands);
  } catch (error) {
    console.error("Error fetching demand posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verify auth token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id || action !== 'upvote') {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(decoded.userId);
    const postId = new ObjectId(id);

    // Check if user already upvoted
    const existingVote = await db.collection("demands").findOne({
      _id: postId,
      upvotedBy: { $in: [userId] }
    });

    let updatedPost;
    
    if (existingVote) {
      // Remove upvote
      updatedPost = await db.collection("demands").findOneAndUpdate(
        { _id: postId },
        { 
          $inc: { upvotes: -1 },
          $pull: { upvotedBy: userId }
        },
        { returnDocument: 'after' }
      );
    } else {
      // Add upvote
      updatedPost = await db.collection("demands").findOneAndUpdate(
        { _id: postId },
        { 
          $inc: { upvotes: 1 },
          $addToSet: { upvotedBy: userId }
        },
        { returnDocument: 'after' }
      );
    }

    if (!updatedPost.value) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...formatDemandPost(updatedPost.value),
      hasUpvoted: !existingVote
    });
  } catch (error) {
    console.error("Error updating demand post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

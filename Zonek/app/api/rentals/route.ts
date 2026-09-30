import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

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

    const { 
      title, 
      description, 
      category, 
      location, 
      price, 
      images = [],
      coordinates = []
    } = await req.json();

    if (!title || !description || !category || !location || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const rental = {
      title,
      description,
      category,
      location,
      price: Number(price),
      images,
      coordinates,
      createdBy: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("rentals").insertOne(rental);

    return NextResponse.json(
      { 
        id: result.insertedId,
        ...rental,
        createdBy: decoded.userId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating rental post:", error);
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

    const rentals = await db
      .collection("rentals")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Format the response
    const formattedRentals = rentals.map(rental => ({
      id: rental._id.toString(),
      title: rental.title,
      description: rental.description,
      category: rental.category,
      location: rental.location,
      price: rental.price,
      images: rental.images || [],
      coordinates: rental.coordinates || [],
      createdBy: rental.createdBy.toString(),
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt
    }));

    return NextResponse.json(formattedRentals);
  } catch (error) {
    console.error("Error fetching rental posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

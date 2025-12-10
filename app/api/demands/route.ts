import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { IDemand } from "@/lib/models/Demand";
import { ObjectId } from "mongodb";

execute: (): Promise<NextResponse> => {
  throw new Error('Function not implemented.')
}

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

    const { title, description, category, location, coordinates } =
      await req.json();

    if (!title || !description || !category || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const demand: IDemand = {
      title,
      description,
      category,
      location,
      coordinates,
      createdBy: new ObjectId(decoded.userId),
      votes: 0,
      upvotedBy: [],
      status: "active",
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("demands").insertOne(demand);

    return NextResponse.json(
      { message: "Demand created", demandId: result.insertedId },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    const demands = await db
      .collection("demands")
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(demands);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword, generateToken } from "@/lib/auth";
import { IUser } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, userType } = await req.json();

    // Validation
    if (!fullName || !email || !password || !userType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user: IUser = {
      fullName,
      email,
      password: hashedPassword,
      userType,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(user);

    // Generate token
    const token = generateToken(result.insertedId.toString());

    return NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: { fullName, email, userType },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "An error occurred during signup. Please try again later." },
      { status: 500 }
    );
  }
}

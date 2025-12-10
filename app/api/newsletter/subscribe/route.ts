import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { INewsletter } from "@/lib/models/Newsletter";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if already subscribed
    const existing = await db
      .collection("newsletter")
      .findOne({ email, active: true });

    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed" },
        { status: 409 }
      );
    }

    const newsletter: INewsletter = {
      email,
      subscribedAt: new Date(),
      active: true,
    };

    await db.collection("newsletter").insertOne(newsletter);

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/apply/start - Start a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if application already exists for this email
    const existingApplication = await prisma.jobApplication.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingApplication) {
      // Return existing application token
      return NextResponse.json({
        accessToken: existingApplication.accessToken,
        isExisting: true,
        message: "Application already exists for this email",
      });
    }

    // Create new application
    const application = await prisma.jobApplication.create({
      data: {
        email: email.toLowerCase(),
        positionAppliedFor: "Direct Support Professional (DSP)",
      },
    });

    return NextResponse.json({
      accessToken: application.accessToken,
      isExisting: false,
      message: "Application created successfully",
    });
  } catch (error) {
    console.error("Error starting application:", error);
    return NextResponse.json(
      { error: "Failed to start application" },
      { status: 500 }
    );
  }
}

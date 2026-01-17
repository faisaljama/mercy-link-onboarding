import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS } from "@/lib/hr/constants";
import { put } from "@vercel/blob";

// GET /api/apply/[accessToken]/documents - List documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ documents: application.documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/apply/[accessToken]/documents - Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application can be edited
    const editableStatuses: string[] = [
      APPLICATION_STATUS.DRAFT,
      APPLICATION_STATUS.APPROVED,
      APPLICATION_STATUS.ONBOARDING,
    ];
    if (!editableStatuses.includes(application.status)) {
      return NextResponse.json(
        { error: "Cannot upload documents in current status" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const formType = formData.get("formType") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and image files are allowed" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(
      `applications/${application.id}/${documentType}/${file.name}`,
      file,
      { access: "public" }
    );

    // Create document record
    const document = await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        documentType,
        formType: formType || null,
        fileName: file.name,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json({
      document,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

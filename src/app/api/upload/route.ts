import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("type") as string; // "document", "photo", "resource"
    const meetingComplianceId = formData.get("meetingComplianceId") as string | null;
    const clientId = formData.get("clientId") as string | null;
    const employeeId = formData.get("employeeId") as string | null;
    const complianceItemId = formData.get("complianceItemId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes: Record<string, string[]> = {
      document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "text/plain",
        "text/csv",
      ],
      photo: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      resource: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    const typeAllowed = allowedTypes[uploadType || "document"];

    // Check file type - be more lenient if type detection fails
    if (typeAllowed && !typeAllowed.includes(file.type) && file.type !== "") {
      // Check by extension as fallback
      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif", "webp", "txt", "csv"];
      if (!ext || !allowedExtensions.includes(ext)) {
        return NextResponse.json(
          { error: `File type "${file.type || "unknown"}" not allowed. Please upload PDF, DOC, DOCX, XLS, XLSX, or image files.` },
          { status: 400 }
        );
      }
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "bin";
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 50);
    const filename = `${uploadType || "document"}/${timestamp}-${randomString}-${sanitizedName}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // If any document linkage IDs are provided, create a Document record
    if (meetingComplianceId || clientId || employeeId || complianceItemId) {
      const document = await prisma.document.create({
        data: {
          fileName: file.name,
          filePath: blob.url,
          fileType: file.type,
          fileSize: file.size,
          uploadedById: session.id,
          meetingComplianceId: meetingComplianceId || null,
          clientId: clientId || null,
          employeeId: employeeId || null,
          complianceItemId: complianceItemId || null,
        },
      });

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          url: blob.url,
          fileName: document.fileName,
          filePath: document.filePath,
          fileSize: document.fileSize,
          fileType: document.fileType,
          uploadedAt: document.uploadedAt.toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

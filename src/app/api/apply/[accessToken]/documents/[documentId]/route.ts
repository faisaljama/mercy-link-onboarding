import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS } from "@/lib/hr/constants";
import { del } from "@vercel/blob";

// DELETE /api/apply/[accessToken]/documents/[documentId] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string; documentId: string }> }
) {
  try {
    const { accessToken, documentId } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { accessToken },
      include: {
        documents: {
          where: { id: documentId },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const document = application.documents[0];
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
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
        { error: "Cannot delete documents in current status" },
        { status: 403 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(document.filePath);
    } catch (blobError) {
      console.error("Error deleting blob:", blobError);
      // Continue even if blob deletion fails
    }

    // Delete document record
    await prisma.applicationDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

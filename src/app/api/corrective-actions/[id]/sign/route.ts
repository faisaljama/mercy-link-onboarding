import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/corrective-actions/[id]/sign - Submit signature for corrective action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { signerType, signatureData, employeeComments, acknowledged } = body;

    if (!signerType || !signatureData) {
      return NextResponse.json(
        { error: "Signer type and signature data are required" },
        { status: 400 }
      );
    }

    const validSignerTypes = ["EMPLOYEE", "SUPERVISOR", "WITNESS", "HR"];
    if (!validSignerTypes.includes(signerType)) {
      return NextResponse.json(
        { error: "Invalid signer type" },
        { status: 400 }
      );
    }

    const action = await prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        employee: true,
        signatures: true,
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Corrective action not found" },
        { status: 404 }
      );
    }

    if (action.status === "VOIDED") {
      return NextResponse.json(
        { error: "Cannot sign a voided corrective action" },
        { status: 400 }
      );
    }

    // Check if this signer type already signed
    const existingSignature = action.signatures.find(
      (s) => s.signerType === signerType && s.signerId === session.id
    );

    if (existingSignature) {
      return NextResponse.json(
        { error: "You have already signed this corrective action" },
        { status: 400 }
      );
    }

    // Validate signature data (should be base64)
    if (!signatureData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid signature format. Expected base64 image data." },
        { status: 400 }
      );
    }

    // Create signature
    const signature = await prisma.correctiveActionSignature.create({
      data: {
        correctiveActionId: id,
        signerType,
        signerId: session.id,
        signatureData,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        deviceInfo: request.headers.get("user-agent") || null,
      },
    });

    // If employee signed, update action status and add comments
    if (signerType === "EMPLOYEE") {
      await prisma.correctiveAction.update({
        where: { id },
        data: {
          status: acknowledged === false ? "DISPUTED" : "ACKNOWLEDGED",
          employeeComments: employeeComments || null,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "STATUS_CHANGE",
        entityType: "CORRECTIVE_ACTION",
        entityId: id,
        details: JSON.stringify({
          signerType,
          signedAt: signature.signedAt,
          acknowledged: signerType === "EMPLOYEE" ? acknowledged : null,
        }),
      },
    });

    // Get updated action
    const updatedAction = await prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        signatures: {
          include: {
            signer: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      signature,
      action: updatedAction,
    });
  } catch (error) {
    console.error("Error signing corrective action:", error);
    return NextResponse.json(
      { error: "Failed to sign corrective action" },
      { status: 500 }
    );
  }
}

// GET /api/corrective-actions/[id]/sign - Get signature status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const action = await prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        signatures: {
          include: {
            signer: { select: { id: true, name: true } },
          },
          orderBy: { signedAt: "asc" },
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Corrective action not found" },
        { status: 404 }
      );
    }

    const signatureStatus = {
      supervisor: action.signatures.find((s) => s.signerType === "SUPERVISOR"),
      witness: action.signatures.find((s) => s.signerType === "WITNESS"),
      employee: action.signatures.find((s) => s.signerType === "EMPLOYEE"),
      hr: action.signatures.find((s) => s.signerType === "HR"),
    };

    return NextResponse.json({
      status: action.status,
      signatures: action.signatures,
      signatureStatus,
      hasSupervisorSignature: !!signatureStatus.supervisor,
      hasWitnessSignature: !!signatureStatus.witness,
      hasEmployeeSignature: !!signatureStatus.employee,
    });
  } catch (error) {
    console.error("Error getting signature status:", error);
    return NextResponse.json(
      { error: "Failed to get signature status" },
      { status: 500 }
    );
  }
}

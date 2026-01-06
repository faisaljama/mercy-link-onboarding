import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "LOGOUT",
          entityType: "USER",
          entityId: session.id,
          details: JSON.stringify({ email: session.email }),
        },
      });
    }

    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}

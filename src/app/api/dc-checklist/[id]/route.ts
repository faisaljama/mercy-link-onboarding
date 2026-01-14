import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Get single DC checklist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);

  const checklist = await prisma.dCDailyChecklist.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!checklist) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  return NextResponse.json(checklist);
}

// PUT - Update DC checklist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const data = await request.json();

  const existing = await prisma.dCDailyChecklist.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  // Permission check: Admin/HR can edit any, others can only edit their own
  const isAdmin = session.role === "ADMIN" || session.role === "HR";
  const isOwner = existing.createdById === session.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "You can only edit your own checklists" },
      { status: 403 }
    );
  }

  const checklist = await prisma.dCDailyChecklist.update({
    where: { id },
    data: {
      visitType: data.visitType,
      // Remote tasks
      remoteLogNotesReviewed: data.remoteLogNotesReviewed,
      remoteGmailChecked: data.remoteGmailChecked,
      remoteAppointmentsReviewed: data.remoteAppointmentsReviewed,
      remoteCalendarUpdated: data.remoteCalendarUpdated,
      remoteScheduleVerified: data.remoteScheduleVerified,
      remoteClockInReviewed: data.remoteClockInReviewed,
      remoteControlledSubstances: data.remoteControlledSubstances,
      remoteMedsAdministered: data.remoteMedsAdministered,
      remoteProgressNotesReviewed: data.remoteProgressNotesReviewed,
      remotePrnDocumented: data.remotePrnDocumented,
      remoteIncidentReportsReviewed: data.remoteIncidentReportsReviewed,
      remoteAppointmentsFollowUp: data.remoteAppointmentsFollowUp,
      remoteStaffTrainingChecked: data.remoteStaffTrainingChecked,
      remoteEveningMedsReviewed: data.remoteEveningMedsReviewed,
      remoteNarcoticCountsVerified: data.remoteNarcoticCountsVerified,
      // Onsite tasks
      onsiteClockedIn: data.onsiteClockedIn,
      onsiteHandoffReviewed: data.onsiteHandoffReviewed,
      onsiteVerbalHandoff: data.onsiteVerbalHandoff,
      onsiteNarcoticCount: data.onsiteNarcoticCount,
      onsitePettyCashCount: data.onsitePettyCashCount,
      onsiteMedQuantitiesReviewed: data.onsiteMedQuantitiesReviewed,
      onsitePrnMedsChecked: data.onsitePrnMedsChecked,
      onsiteOverflowBinsChecked: data.onsiteOverflowBinsChecked,
      onsitePharmacyDeliveryReviewed: data.onsitePharmacyDeliveryReviewed,
      onsiteMedStorageChecked: data.onsiteMedStorageChecked,
      onsiteGlucometerSupplies: data.onsiteGlucometerSupplies,
      onsiteStaffInteractions: data.onsiteStaffInteractions,
      onsiteRoomsClean: data.onsiteRoomsClean,
      onsiteDietaryFollowed: data.onsiteDietaryFollowed,
      onsiteActivitiesObserved: data.onsiteActivitiesObserved,
      onsiteResidentSpoken: data.onsiteResidentSpoken,
      onsiteReceiptBinderReviewed: data.onsiteReceiptBinderReviewed,
      onsiteResidentBindersReviewed: data.onsiteResidentBindersReviewed,
      onsiteAfterVisitSummaries: data.onsiteAfterVisitSummaries,
      onsiteOutcomeTracker: data.onsiteOutcomeTracker,
      onsiteFireDrillBinder: data.onsiteFireDrillBinder,
      onsiteGenoaDeliveryBinder: data.onsiteGenoaDeliveryBinder,
      onsiteCommonAreasCleaned: data.onsiteCommonAreasCleaned,
      onsiteFoodLabeled: data.onsiteFoodLabeled,
      onsiteSuppliesStocked: data.onsiteSuppliesStocked,
      onsiteBathroomsCleaned: data.onsiteBathroomsCleaned,
      onsiteGarbageChecked: data.onsiteGarbageChecked,
      onsiteIpadCharged: data.onsiteIpadCharged,
      onsiteDoorsSecure: data.onsiteDoorsSecure,
      onsiteWaterSoftener: data.onsiteWaterSoftener,
      onsiteFurnaceFilter: data.onsiteFurnaceFilter,
      onsiteExteriorChecked: data.onsiteExteriorChecked,
      onsiteSnowRemoval: data.onsiteSnowRemoval,
      onsiteStaffCoaching: data.onsiteStaffCoaching,
      onsiteMailVoicemail: data.onsiteMailVoicemail,
      notes: data.notes,
      followUpItems: data.followUpItems,
      issuesIdentified: data.issuesIdentified,
      isSubmitted: data.isSubmitted,
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : null,
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(checklist);
}

// DELETE - Delete DC checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);

  const existing = await prisma.dCDailyChecklist.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  // Permission check: Admin/HR can delete any, others can only delete their own
  const isAdmin = session.role === "ADMIN" || session.role === "HR";
  const isOwner = existing.createdById === session.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "You can only delete your own checklists" },
      { status: 403 }
    );
  }

  await prisma.dCDailyChecklist.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - List DC daily checklists with filters
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const houseIds = await getUserHouseIds(session.id);
  const searchParams = request.nextUrl.searchParams;
  const houseId = searchParams.get("houseId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = {
    houseId: { in: houseIds },
  };

  if (houseId && houseIds.includes(houseId)) {
    where.houseId = houseId;
  }

  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  const checklists = await prisma.dCDailyChecklist.findMany({
    where,
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(checklists);
}

// POST - Create new DC daily checklist
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const houseIds = await getUserHouseIds(session.id);
  const data = await request.json();

  if (!houseIds.includes(data.houseId)) {
    return NextResponse.json({ error: "Access denied to this house" }, { status: 403 });
  }

  // Check if checklist already exists for this house and date
  const existingChecklist = await prisma.dCDailyChecklist.findFirst({
    where: {
      houseId: data.houseId,
      date: new Date(data.date),
    },
  });

  if (existingChecklist) {
    return NextResponse.json(
      { error: "A checklist already exists for this house and date" },
      { status: 400 }
    );
  }

  const checklist = await prisma.dCDailyChecklist.create({
    data: {
      houseId: data.houseId,
      date: new Date(data.date),
      visitType: data.visitType || "REMOTE",
      createdById: session.id,
      // Remote tasks
      remoteLogNotesReviewed: data.remoteLogNotesReviewed || false,
      remoteGmailChecked: data.remoteGmailChecked || false,
      remoteAppointmentsReviewed: data.remoteAppointmentsReviewed || false,
      remoteCalendarUpdated: data.remoteCalendarUpdated || false,
      remoteScheduleVerified: data.remoteScheduleVerified || false,
      remoteClockInReviewed: data.remoteClockInReviewed || false,
      remoteControlledSubstances: data.remoteControlledSubstances || false,
      remoteMedsAdministered: data.remoteMedsAdministered || false,
      remoteProgressNotesReviewed: data.remoteProgressNotesReviewed || false,
      remotePrnDocumented: data.remotePrnDocumented || false,
      remoteIncidentReportsReviewed: data.remoteIncidentReportsReviewed || false,
      remoteAppointmentsFollowUp: data.remoteAppointmentsFollowUp || false,
      remoteStaffTrainingChecked: data.remoteStaffTrainingChecked || false,
      remoteEveningMedsReviewed: data.remoteEveningMedsReviewed || false,
      remoteNarcoticCountsVerified: data.remoteNarcoticCountsVerified || false,
      // Onsite tasks
      onsiteClockedIn: data.onsiteClockedIn || false,
      onsiteHandoffReviewed: data.onsiteHandoffReviewed || false,
      onsiteVerbalHandoff: data.onsiteVerbalHandoff || false,
      onsiteNarcoticCount: data.onsiteNarcoticCount || false,
      onsitePettyCashCount: data.onsitePettyCashCount || false,
      onsiteMedQuantitiesReviewed: data.onsiteMedQuantitiesReviewed || false,
      onsitePrnMedsChecked: data.onsitePrnMedsChecked || false,
      onsiteOverflowBinsChecked: data.onsiteOverflowBinsChecked || false,
      onsitePharmacyDeliveryReviewed: data.onsitePharmacyDeliveryReviewed || false,
      onsiteMedStorageChecked: data.onsiteMedStorageChecked || false,
      onsiteGlucometerSupplies: data.onsiteGlucometerSupplies || false,
      onsiteStaffInteractions: data.onsiteStaffInteractions || false,
      onsiteRoomsClean: data.onsiteRoomsClean || false,
      onsiteDietaryFollowed: data.onsiteDietaryFollowed || false,
      onsiteActivitiesObserved: data.onsiteActivitiesObserved || false,
      onsiteResidentSpoken: data.onsiteResidentSpoken || false,
      onsiteReceiptBinderReviewed: data.onsiteReceiptBinderReviewed || false,
      onsiteResidentBindersReviewed: data.onsiteResidentBindersReviewed || false,
      onsiteAfterVisitSummaries: data.onsiteAfterVisitSummaries || false,
      onsiteOutcomeTracker: data.onsiteOutcomeTracker || false,
      onsiteFireDrillBinder: data.onsiteFireDrillBinder || false,
      onsiteCommonAreasCleaned: data.onsiteCommonAreasCleaned || false,
      onsiteFoodLabeled: data.onsiteFoodLabeled || false,
      onsiteSuppliesStocked: data.onsiteSuppliesStocked || false,
      onsiteBathroomsCleaned: data.onsiteBathroomsCleaned || false,
      onsiteGarbageChecked: data.onsiteGarbageChecked || false,
      onsiteIpadCharged: data.onsiteIpadCharged || false,
      onsiteDoorsSecure: data.onsiteDoorsSecure || false,
      onsiteWaterSoftener: data.onsiteWaterSoftener || false,
      onsiteFurnaceFilter: data.onsiteFurnaceFilter || false,
      onsiteExteriorChecked: data.onsiteExteriorChecked || false,
      onsiteStaffCoaching: data.onsiteStaffCoaching || false,
      notes: data.notes || null,
      followUpItems: data.followUpItems || null,
      issuesIdentified: data.issuesIdentified || null,
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(checklist, { status: 201 });
}

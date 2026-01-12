import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// MHCP 2026 Billing Calendar - hardcoded for efficiency
const MHCP_BILLING_CYCLES_2026 = [
  { cycle: 1, cutOff: "2026-01-15", eftPayment: "2026-01-20" },
  { cycle: 2, cutOff: "2026-01-29", eftPayment: "2026-02-03" },
  { cycle: 3, cutOff: "2026-02-12", eftPayment: "2026-02-17" },
  { cycle: 4, cutOff: "2026-02-26", eftPayment: "2026-03-03" },
  { cycle: 5, cutOff: "2026-03-12", eftPayment: "2026-03-17" },
  { cycle: 6, cutOff: "2026-03-26", eftPayment: "2026-03-31" },
  { cycle: 7, cutOff: "2026-04-09", eftPayment: "2026-04-14" },
  { cycle: 8, cutOff: "2026-04-23", eftPayment: "2026-04-28" },
  { cycle: 9, cutOff: "2026-05-07", eftPayment: "2026-05-12" },
  { cycle: 10, cutOff: "2026-05-21", eftPayment: "2026-05-26" },
  { cycle: 11, cutOff: "2026-06-04", eftPayment: "2026-06-09" },
  { cycle: 12, cutOff: "2026-06-18", eftPayment: "2026-06-23" },
  { cycle: 13, cutOff: "2026-07-02", eftPayment: "2026-07-07" },
  { cycle: 14, cutOff: "2026-07-16", eftPayment: "2026-07-21" },
  { cycle: 15, cutOff: "2026-07-30", eftPayment: "2026-08-04" },
  { cycle: 16, cutOff: "2026-08-13", eftPayment: "2026-08-18" },
  { cycle: 17, cutOff: "2026-08-27", eftPayment: "2026-09-01" },
  { cycle: 18, cutOff: "2026-09-10", eftPayment: "2026-09-15" },
  { cycle: 19, cutOff: "2026-09-24", eftPayment: "2026-09-29" },
  { cycle: 20, cutOff: "2026-10-08", eftPayment: "2026-10-13" },
  { cycle: 21, cutOff: "2026-10-22", eftPayment: "2026-10-27" },
  { cycle: 22, cutOff: "2026-11-05", eftPayment: "2026-11-10" },
  { cycle: 23, cutOff: "2026-11-19", eftPayment: "2026-11-24" },
  { cycle: 24, cutOff: "2026-12-03", eftPayment: "2026-12-08" },
  { cycle: 25, cutOff: "2026-12-17", eftPayment: "2026-12-22" },
  { cycle: 26, cutOff: "2026-12-31", eftPayment: "2027-01-05" },
];

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    const reports = await prisma.billingReport.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ dateProcessed: "desc" }],
    });

    // Get summary stats
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const yearlyTotal = await prisma.billingReport.aggregate({
      where: { year: currentYear },
      _sum: { totalCharges: true },
      _count: true,
    });

    const monthlyTotal = await prisma.billingReport.aggregate({
      where: { month: currentMonth, year: currentYear },
      _sum: { totalCharges: true },
      _count: true,
    });

    return NextResponse.json({
      reports,
      billingCycles: MHCP_BILLING_CYCLES_2026,
      stats: {
        yearlyTotal: yearlyTotal._sum.totalCharges || 0,
        yearlyCount: yearlyTotal._count,
        monthlyTotal: monthlyTotal._sum.totalCharges || 0,
        monthlyCount: monthlyTotal._count,
      },
    });
  } catch (error) {
    console.error("Error fetching billing reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      serviceDateStart,
      serviceDateEnd,
      dateProcessed,
      billingCycle,
      entries,
      notes,
    } = body;

    // Validation
    if (!serviceDateStart || !serviceDateEnd || !dateProcessed) {
      return NextResponse.json(
        { error: "Service date range and date processed are required" },
        { status: 400 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "At least one billing entry is required" },
        { status: 400 }
      );
    }

    // Calculate totals from entries
    let totalCharges = 0;
    let totalClaims = 0;
    for (const entry of entries) {
      totalCharges += parseFloat(entry.totalCharges) || 0;
      totalClaims += parseInt(entry.totalClaims) || 0;
    }

    // Determine month/year from service date end
    const serviceEnd = new Date(serviceDateEnd);
    const month = serviceEnd.getMonth() + 1;
    const year = serviceEnd.getFullYear();

    // Get billing cycle info if provided
    let claimCutOffDate = null;
    let eftPaymentDate = null;
    if (billingCycle) {
      const cycleInfo = MHCP_BILLING_CYCLES_2026.find(
        (c) => c.cycle === billingCycle
      );
      if (cycleInfo) {
        claimCutOffDate = new Date(cycleInfo.cutOff);
        eftPaymentDate = new Date(cycleInfo.eftPayment);
      }
    }

    // Create the billing report with entries
    const report = await prisma.billingReport.create({
      data: {
        serviceDateStart: new Date(serviceDateStart),
        serviceDateEnd: new Date(serviceDateEnd),
        dateProcessed: new Date(dateProcessed),
        billingCycle,
        claimCutOffDate,
        eftPaymentDate,
        totalCharges,
        totalClaims,
        month,
        year,
        notes,
        createdById: session.id,
        entries: {
          create: entries.map(
            (
              entry: {
                houseName: string;
                clientName?: string;
                totalClaims: number;
                totalCharges: number;
                entryStatus?: string;
                insuranceProvider?: string;
              },
              index: number
            ) => ({
              houseName: entry.houseName,
              clientName: entry.clientName || null,
              totalClaims: parseInt(String(entry.totalClaims)) || 0,
              totalCharges: parseFloat(String(entry.totalCharges)) || 0,
              entryStatus: entry.entryStatus || null,
              insuranceProvider: entry.insuranceProvider || null,
              sortOrder: index,
            })
          ),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error creating billing report:", error);
    return NextResponse.json(
      { error: "Failed to create billing report" },
      { status: 500 }
    );
  }
}

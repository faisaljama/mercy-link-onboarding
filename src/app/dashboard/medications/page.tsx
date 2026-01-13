import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Package,
  Clock,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { MedicationFilters } from "./medication-filters";
import { ScheduledMedSection } from "./scheduled-med-section";
import { PrnInventorySection } from "./prn-inventory-section";
import { VerificationHistory } from "./verification-history";
import { LowStockBanner } from "./low-stock-banner";

const LOW_STOCK_THRESHOLD = 12;

interface SearchParams {
  house?: string;
  resident?: string;
  startDate?: string;
  endDate?: string;
}

async function getMedicationData(houseIds: string[], filters: SearchParams) {
  const { house, resident, startDate, endDate } = filters;

  const effectiveHouseIds = house && houseIds.includes(house) ? [house] : houseIds;

  // Get houses for filter
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Get residents for filter
  const residents = await prisma.client.findMany({
    where: {
      houseId: { in: effectiveHouseIds },
      status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      houseId: true,
      house: { select: { name: true } },
    },
    orderBy: { firstName: "asc" },
  });

  // Build date range
  const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
  const end = endDate ? new Date(endDate) : new Date();

  // Get scheduled med verifications
  const scheduledWhere: Record<string, unknown> = {
    houseId: { in: effectiveHouseIds },
    visitDate: { gte: start, lte: end },
  };
  if (resident) scheduledWhere.clientId = resident;

  const scheduledVerifications = await prisma.scheduledMedVerification.findMany({
    where: scheduledWhere,
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      house: { select: { id: true, name: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
    orderBy: { visitDate: "desc" },
    take: 50,
  });

  // Get PRN inventory
  const prnWhere: Record<string, unknown> = {
    houseId: { in: effectiveHouseIds },
  };
  if (resident) prnWhere.clientId = resident;

  const prnInventory = await prisma.prnInventory.findMany({
    where: prnWhere,
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      house: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ quantityRemaining: "asc" }, { updatedAt: "desc" }],
  });

  // Get low stock count
  const lowStockCount = prnInventory.filter(
    (p) => p.quantityRemaining <= LOW_STOCK_THRESHOLD
  ).length;

  // Stats
  const matchCount = scheduledVerifications.filter((v) => {
    const visitDate = new Date(v.visitDate);
    const medPackDate = new Date(v.medPackDate);
    return visitDate.toDateString() === medPackDate.toDateString();
  }).length;

  const mismatchCount = scheduledVerifications.length - matchCount;

  return {
    houses,
    residents,
    scheduledVerifications,
    prnInventory,
    stats: {
      totalVerifications: scheduledVerifications.length,
      matchCount,
      mismatchCount,
      totalPrn: prnInventory.length,
      lowStockCount,
    },
  };
}

export default async function MedicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Only DC, DM, Admin can access
  const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  const { houses, residents, scheduledVerifications, prnInventory, stats } =
    await getMedicationData(houseIds, params);

  const lowStockItems = prnInventory.filter(
    (p) => p.quantityRemaining <= LOW_STOCK_THRESHOLD
  );

  return (
    <div className="space-y-6">
      {/* Low Stock Banner */}
      {lowStockItems.length > 0 && <LowStockBanner items={lowStockItems} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Pill className="h-8 w-8 text-purple-600" />
            Medication Verification
          </h1>
          <p className="text-slate-500 mt-1">
            Verify scheduled medications and track PRN inventory
          </p>
        </div>
      </div>

      {/* Filters */}
      <MedicationFilters
        houses={houses}
        residents={residents}
        currentFilters={params}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Verifications</p>
                <p className="text-2xl font-bold">{stats.totalVerifications}</p>
              </div>
              <Calendar className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Dates Match</p>
                <p className="text-2xl font-bold text-green-600">{stats.matchCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Mismatches</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.mismatchCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">PRN Items</p>
                <p className="text-2xl font-bold">{stats.totalPrn}</p>
              </div>
              <Package className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.lowStockCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Low Stock</p>
                <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? "text-red-600" : "text-slate-900"}`}>
                  {stats.lowStockCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scheduled Med Verification */}
        <ScheduledMedSection
          verifications={scheduledVerifications}
          residents={residents}
        />

        {/* PRN Inventory */}
        <PrnInventorySection
          inventory={prnInventory}
          residents={residents}
          lowStockThreshold={LOW_STOCK_THRESHOLD}
        />
      </div>

      {/* History */}
      <VerificationHistory houseIds={houseIds} filters={params} />
    </div>
  );
}

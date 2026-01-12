import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pill,
  Calendar,
  Clock,
  Home,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Image,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewDeliveryDialog } from "./new-delivery-dialog";
import { PrintSelector } from "./print-selector";

async function getDeliveryData(houseIds: string[]) {
  const deliveries = await prisma.genoaDelivery.findMany({
    where: {
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      receivedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { deliveryDate: "desc" },
  });

  const houses = await prisma.house.findMany({
    where: {
      id: { in: houseIds },
    },
    orderBy: { name: "asc" },
  });

  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: {
      house: true,
    },
    orderBy: { lastName: "asc" },
  });

  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "LEAD_STAFF"],
      },
    },
    orderBy: { name: "asc" },
  });

  return { deliveries, houses, clients, employees };
}

function getVerificationBadge(value: boolean | null) {
  if (value === true) {
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Yes
      </Badge>
    );
  } else if (value === false) {
    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="mr-1 h-3 w-3" />
        No
      </Badge>
    );
  }
  return <span className="text-slate-400 text-sm">Pending</span>;
}

export default async function GenoaDeliveriesPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const { deliveries, houses, clients, employees } = await getDeliveryData(houseIds);

  // Stats
  const thisMonth = new Date();
  const thisMonthDeliveries = deliveries.filter((d) => {
    const date = new Date(d.deliveryDate);
    return (
      date.getMonth() === thisMonth.getMonth() &&
      date.getFullYear() === thisMonth.getFullYear()
    );
  });

  const verified = deliveries.filter(
    (d) => d.medicationsMatch === true && d.properlyStored === true
  ).length;

  const issues = deliveries.filter(
    (d) => d.medicationsMatch === false || d.properlyStored === false
  ).length;

  const pending = deliveries.filter(
    (d) => d.medicationsMatch === null || d.properlyStored === null
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Genoa Pharmacy Deliveries</h1>
          <p className="text-slate-500">
            Track and verify medication deliveries from Genoa Pharmacy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintSelector houses={houses} />
          <NewDeliveryDialog houses={houses} clients={clients} employees={employees} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Month</p>
                <p className="text-2xl font-bold">{thisMonthDeliveries.length}</p>
              </div>
              <Pill className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Verified</p>
                <p className="text-2xl font-bold text-green-600">{verified}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Issues Found</p>
                <p className="text-2xl font-bold text-red-600">{issues}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Verification</p>
                <p className="text-2xl font-bold text-orange-600">{pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>
            All Genoa pharmacy deliveries and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Pill className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No deliveries recorded yet</p>
              <p className="text-sm">Add a new delivery to start tracking</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Meds Match</TableHead>
                  <TableHead>Stored Properly</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => {
                  const photos = JSON.parse(delivery.manifestPhotos || "[]");
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {format(new Date(delivery.deliveryDate), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="h-3 w-3" />
                            {delivery.deliveryTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-slate-400" />
                          {delivery.house.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {delivery.isAllResidents ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-blue-600 font-medium">All Residents</span>
                          </div>
                        ) : delivery.client ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            {delivery.client.firstName} {delivery.client.lastName}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{delivery.receivedBy.name}</span>
                      </TableCell>
                      <TableCell>
                        {photos.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Image className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{photos.length}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>{getVerificationBadge(delivery.medicationsMatch)}</TableCell>
                      <TableCell>{getVerificationBadge(delivery.properlyStored)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/genoa-deliveries/${delivery.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

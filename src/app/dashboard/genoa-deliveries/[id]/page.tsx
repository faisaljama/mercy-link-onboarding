import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteDeliveryButton } from "./delete-button";

async function getDelivery(id: string, houseIds: string[]) {
  const delivery = await prisma.genoaDelivery.findFirst({
    where: {
      id,
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
  });

  return delivery;
}

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const delivery = await getDelivery(id, houseIds);

  if (!delivery) {
    notFound();
  }

  const photos = JSON.parse(delivery.manifestPhotos || "[]") as string[];
  const hasIssues =
    delivery.medicationsMatch === false || delivery.properlyStored === false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/genoa-deliveries">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deliveries
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Delivery Details</h1>
          <p className="text-slate-500">
            {format(new Date(delivery.deliveryDate), "MMMM d, yyyy")} at{" "}
            {delivery.deliveryTime}
          </p>
        </div>
        {hasIssues && (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-4 w-4" />
            Issues Reported
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Home className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">House</p>
                <p className="font-medium">{delivery.house.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">
                  {format(new Date(delivery.deliveryDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Time</p>
                <p className="font-medium">{delivery.deliveryTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Received By</p>
                <p className="font-medium">{delivery.receivedBy.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                {delivery.isAllResidents ? (
                  <Users className="h-5 w-5 text-blue-600" />
                ) : (
                  <User className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500">Recipient</p>
                <p className="font-medium">
                  {delivery.isAllResidents ? (
                    <span className="text-blue-600">All Residents Monthly Delivery</span>
                  ) : delivery.client ? (
                    `${delivery.client.firstName} ${delivery.client.lastName}`
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>
              Medication verification and storage confirmation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Did medications match the delivery manifest?
              </p>
              <div className="flex items-center gap-2">
                {delivery.medicationsMatch === true ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Yes - Matched
                  </Badge>
                ) : delivery.medicationsMatch === false ? (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="mr-1 h-4 w-4" />
                    No - Discrepancy
                  </Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
              {delivery.medicationsMatch === false &&
                delivery.medicationsMatchNotes && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Explanation:</strong> {delivery.medicationsMatchNotes}
                    </p>
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Were medications stored properly in grey Genoa delivery box?
              </p>
              <div className="flex items-center gap-2">
                {delivery.properlyStored === true ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Yes - Stored Properly
                  </Badge>
                ) : delivery.properlyStored === false ? (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="mr-1 h-4 w-4" />
                    No - Storage Issue
                  </Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
              {delivery.properlyStored === false &&
                delivery.properlyStoredNotes && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Explanation:</strong> {delivery.properlyStoredNotes}
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manifest Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Delivery Manifest Photos
          </CardTitle>
          <CardDescription>
            {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Image className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>No photos uploaded for this delivery</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <a
                  key={index}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square rounded-lg overflow-hidden border hover:border-blue-500 transition-colors"
                >
                  <img
                    src={photo}
                    alt={`Manifest photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      {delivery.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{delivery.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      {session.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <DeleteDeliveryButton deliveryId={delivery.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

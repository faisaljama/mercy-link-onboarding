import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Home,
  User,
  Heart,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

async function getResidentsData(houseIds: string[], houseFilter: string | null) {
  // Get houses user has access to
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const selectedHouseId = houseFilter && houseIds.includes(houseFilter) ? houseFilter : null;

  // Get residents
  const whereClause: Record<string, unknown> = {
    houseId: { in: houseIds },
    status: "ACTIVE",
  };

  if (selectedHouseId) {
    whereClause.houseId = selectedHouseId;
  }

  const residents = await prisma.client.findMany({
    where: whereClause,
    include: {
      house: {
        select: { id: true, name: true },
      },
      onePageProfile: {
        select: {
          preferredName: true,
          pronouns: true,
          medicalAlerts: true,
          photoUrl: true,
        },
      },
    },
    orderBy: [{ house: { name: "asc" } }, { firstName: "asc" }],
  });

  return { houses, residents };
}

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  const { houses, residents } = await getResidentsData(houseIds, params.house || null);

  if (houses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Home className="h-12 w-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium">No houses assigned</p>
        <p className="text-sm">Contact your supervisor to get assigned to a house.</p>
      </div>
    );
  }

  // Group residents by house
  const residentsByHouse: Record<string, typeof residents> = {};
  for (const resident of residents) {
    const houseId = resident.houseId;
    if (!residentsByHouse[houseId]) {
      residentsByHouse[houseId] = [];
    }
    residentsByHouse[houseId].push(resident);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dsp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resident Profiles</h1>
          <p className="text-slate-500 mt-1">
            View one-page profiles for residents you support
          </p>
        </div>
      </div>

      {/* House Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Filter by House:</span>
        <form>
          <Select defaultValue={params.house || "all"}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="All Houses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <Link href="/dsp/residents">All Houses</Link>
              </SelectItem>
              {houses.map((house) => (
                <SelectItem key={house.id} value={house.id}>
                  <Link href={`/dsp/residents?house=${house.id}`}>{house.name}</Link>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
      </div>

      {/* Residents Grid */}
      {params.house ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {residents.map((resident) => (
            <ResidentCard key={resident.id} resident={resident} />
          ))}
        </div>
      ) : (
        // Group by house when viewing all
        Object.entries(residentsByHouse).map(([houseId, houseResidents]) => {
          const house = houses.find(h => h.id === houseId);
          return (
            <div key={houseId} className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Home className="h-5 w-5 text-slate-400" />
                {house?.name}
                <Badge variant="secondary">{houseResidents.length}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {houseResidents.map((resident) => (
                  <ResidentCard key={resident.id} resident={resident} />
                ))}
              </div>
            </div>
          );
        })
      )}

      {residents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">No residents found</p>
            <p className="text-sm mt-2">There are no active residents at the selected location.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResidentCard({ resident }: { resident: {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  house: { id: string; name: string };
  onePageProfile: {
    preferredName: string | null;
    pronouns: string | null;
    medicalAlerts: string | null;
    photoUrl: string | null;
  } | null;
} }) {
  const profilePhoto = resident.onePageProfile?.photoUrl || resident.photoUrl;
  const preferredName = resident.onePageProfile?.preferredName;
  const pronouns = resident.onePageProfile?.pronouns;
  const hasMedicalAlerts = !!resident.onePageProfile?.medicalAlerts;
  const hasProfile = !!resident.onePageProfile;

  return (
    <Link href={`/dsp/residents/${resident.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={`${resident.firstName} ${resident.lastName}`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">
                  {resident.firstName[0]}{resident.lastName[0]}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">
                {preferredName || resident.firstName}
              </h3>
              <p className="text-sm text-slate-500">
                {resident.firstName} {resident.lastName}
                {pronouns && <span className="text-slate-400"> ({pronouns})</span>}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {hasMedicalAlerts && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Medical Alerts
                  </Badge>
                )}
                {!hasProfile && (
                  <Badge variant="secondary" className="text-xs">
                    No Profile
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

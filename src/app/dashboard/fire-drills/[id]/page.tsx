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
  Flame,
  Calendar,
  Clock,
  Home,
  User,
  Users,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteFireDrillButton } from "./delete-button";

// Helper to get period label
function getPeriodLabel(period: number): string {
  const labels: Record<number, string> = {
    1: "Jan-Feb",
    2: "Mar-Apr",
    3: "May-Jun",
    4: "Jul-Aug",
    5: "Sep-Oct",
    6: "Nov-Dec",
  };
  return labels[period] || "";
}

async function getFireDrill(id: string, houseIds: string[]) {
  const drill = await prisma.fireDrill.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      completedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return drill;
}

export default async function FireDrillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const drill = await getFireDrill(id, houseIds);

  if (!drill) {
    notFound();
  }

  const participants = JSON.parse(drill.participants || "[]") as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/fire-drills">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fire Drills
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Fire Drill Details
          </h1>
          <p className="text-slate-500">
            {format(new Date(drill.drillDate), "MMMM d, yyyy")} at {drill.drillTime}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {getPeriodLabel(drill.biMonthlyPeriod)} {drill.year}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Drill Info */}
        <Card>
          <CardHeader>
            <CardTitle>Drill Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Home className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">House</p>
                <p className="font-medium">{drill.house.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">
                  {format(new Date(drill.drillDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Time</p>
                <p className="font-medium">{drill.drillTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completed By</p>
                <p className="font-medium">{drill.completedBy.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants
            </CardTitle>
            <CardDescription>
              {participants.length} resident{participants.length !== 1 ? "s" : ""} participated
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p className="text-slate-500 text-sm">No participants recorded</p>
            ) : (
              <div className="space-y-2">
                {participants.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary/Analysis/Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Summary / Analysis / Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {drill.summary ? (
            <p className="text-slate-700 whitespace-pre-wrap">{drill.summary}</p>
          ) : (
            <p className="text-slate-500 text-sm">No summary recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {session.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <DeleteFireDrillButton drillId={drill.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

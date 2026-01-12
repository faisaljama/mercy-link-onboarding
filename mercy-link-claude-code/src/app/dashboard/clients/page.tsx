import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ClientFilters } from "./client-filters";

async function getClients(houseIds: string[], houseFilter?: string) {
  const whereClause: Record<string, unknown> = {
    houseId: { in: houseIds },
    status: "ACTIVE",
  };

  if (houseFilter && houseFilter !== "all") {
    whereClause.houseId = houseFilter;
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      house: true,
      complianceItems: {
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      _count: {
        select: {
          complianceItems: {
            where: { status: "OVERDUE" },
          },
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return clients;
}

async function getHouses(houseIds: string[]) {
  return prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });
}

function getComplianceStatus(overdueCount: number, nextItem: { dueDate: Date; status: string } | null) {
  if (overdueCount > 0) {
    return { label: `${overdueCount} Overdue`, color: "bg-red-100 text-red-800", icon: AlertTriangle };
  }
  if (nextItem) {
    const daysUntil = Math.ceil((nextItem.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return { label: `Due in ${daysUntil}d`, color: "bg-orange-100 text-orange-800", icon: Clock };
    }
    return { label: "On Track", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
  }
  return { label: "Complete", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const [clients, houses] = await Promise.all([
    getClients(houseIds, params.house),
    getHouses(houseIds),
  ]);

  const filteredClients = params.search
    ? clients.filter(
        (c) =>
          c.firstName.toLowerCase().includes(params.search!.toLowerCase()) ||
          c.lastName.toLowerCase().includes(params.search!.toLowerCase())
      )
    : clients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage service recipients and their compliance</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      <ClientFilters houses={houses} />

      <Card>
        <CardHeader>
          <CardTitle>All Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Waiver Type</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead>Next Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const status = getComplianceStatus(
                    client._count.complianceItems,
                    client.complianceItems[0] || null
                  );
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {client.lastName}, {client.firstName}
                        </Link>
                      </TableCell>
                      <TableCell>{client.house.name}</TableCell>
                      <TableCell>{format(client.admissionDate, "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.waiverType || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.complianceItems[0] ? (
                          <span className="text-sm">
                            {format(client.complianceItems[0].dueDate, "MMM d")} -{" "}
                            {client.complianceItems[0].itemName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

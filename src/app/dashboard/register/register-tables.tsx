"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Calendar,
  Home,
  FileText,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { EditEntryDialog } from "./edit-entry-dialog";

interface Entry {
  id: string;
  type: string;
  date: Date;
  fromLocation: string | null;
  toLocation: string | null;
  reason: string | null;
  dischargeType: string | null;
  notes: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    serviceTypes: string | null;
    house: {
      id: string;
      name: string;
    };
  };
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CRS: "CRS",
  ICS: "ICS",
  IHS_WITH_TRAINING: "IHS+T",
  IHS_WITHOUT_TRAINING: "IHS",
  NIGHT_SUPERVISION: "Night",
  HOMEMAKING: "HM",
  EA_24_HOUR: "24hr EA",
};

function getServiceBadges(serviceTypes: string | null) {
  if (!serviceTypes) return null;
  try {
    const types = JSON.parse(serviceTypes) as string[];
    if (types.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {types.map((type) => (
          <Badge key={type} variant="outline" className="text-xs bg-blue-50 text-blue-700">
            {SERVICE_TYPE_LABELS[type] || type}
          </Badge>
        ))}
      </div>
    );
  } catch {
    return null;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "ADMISSION":
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case "DISCHARGE":
      return <UserMinus className="h-4 w-4 text-red-600" />;
    case "TRANSFER_IN":
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    case "TRANSFER_OUT":
      return <ArrowRightLeft className="h-4 w-4 text-orange-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-600" />;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "ADMISSION":
      return <Badge className="bg-green-100 text-green-800">Admission</Badge>;
    case "DISCHARGE":
      return <Badge className="bg-red-100 text-red-800">Discharge</Badge>;
    case "TRANSFER_IN":
      return <Badge className="bg-blue-100 text-blue-800">Transfer In</Badge>;
    case "TRANSFER_OUT":
      return <Badge className="bg-orange-100 text-orange-800">Transfer Out</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getDischargeTypeBadge(type: string | null) {
  if (!type) return null;

  switch (type) {
    case "PLANNED":
      return <Badge variant="outline" className="text-xs">Planned</Badge>;
    case "UNPLANNED":
      return <Badge variant="outline" className="text-xs text-orange-600">Unplanned</Badge>;
    case "EMERGENCY":
      return <Badge variant="outline" className="text-xs text-red-600">Emergency</Badge>;
    case "DEATH":
      return <Badge variant="outline" className="text-xs text-slate-600">Death</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{type}</Badge>;
  }
}

export function RegisterTable({
  entries,
  showEditButton = true,
}: {
  entries: Entry[];
  showEditButton?: boolean;
}) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p>No entries found</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>House</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Notes</TableHead>
            {showEditButton && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {format(new Date(entry.date), "MMM d, yyyy")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(entry.type)}
                  {getTypeBadge(entry.type)}
                  {entry.dischargeType && getDischargeTypeBadge(entry.dischargeType)}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/clients/${entry.client.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {entry.client.firstName} {entry.client.lastName}
                </Link>
              </TableCell>
              <TableCell>
                {getServiceBadges(entry.client.serviceTypes) || (
                  <span className="text-slate-400 text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-slate-400" />
                  {entry.client.house.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-slate-600">
                  {entry.type === "ADMISSION" && entry.fromLocation && (
                    <span>From: {entry.fromLocation}</span>
                  )}
                  {entry.type === "DISCHARGE" && entry.toLocation && (
                    <span>To: {entry.toLocation}</span>
                  )}
                  {(entry.type === "TRANSFER_IN" || entry.type === "TRANSFER_OUT") && (
                    <>
                      {entry.fromLocation && <span>From: {entry.fromLocation}</span>}
                      {entry.fromLocation && entry.toLocation && <span> → </span>}
                      {entry.toLocation && <span>To: {entry.toLocation}</span>}
                    </>
                  )}
                  {entry.reason && (
                    <div className="text-xs text-slate-500 mt-1">
                      Reason: {entry.reason}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-500 max-w-[200px] truncate block">
                  {entry.notes || "—"}
                </span>
              </TableCell>
              {showEditButton && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEntry(entry)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingEntry && (
        <EditEntryDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />
      )}
    </>
  );
}

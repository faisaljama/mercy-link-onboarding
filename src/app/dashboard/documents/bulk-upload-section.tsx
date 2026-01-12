"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { BulkDocumentUpload } from "@/components/bulk-document-upload";

interface Entity {
  id: string;
  name: string;
  type: "client" | "employee";
}

interface BulkUploadSectionProps {
  clients: { id: string; firstName: string; lastName: string }[];
  employees: { id: string; firstName: string; lastName: string }[];
}

export function BulkUploadSection({ clients, employees }: BulkUploadSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<"client" | "employee" | "">("");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const entities: Entity[] = [
    ...clients.map((c) => ({
      id: c.id,
      name: `${c.lastName}, ${c.firstName}`,
      type: "client" as const,
    })),
    ...employees.map((e) => ({
      id: e.id,
      name: `${e.lastName}, ${e.firstName}`,
      type: "employee" as const,
    })),
  ];

  const filteredEntities = entityType
    ? entities.filter((e) => e.type === entityType)
    : entities;

  const handleUploadComplete = () => {
    router.refresh();
  };

  const handleClose = () => {
    setOpen(false);
    setEntityType("");
    setSelectedEntityId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Document Upload</DialogTitle>
          <DialogDescription>
            Upload multiple documents at once. Optionally link them to a client or employee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Document Type
              </label>
              <Select
                value={entityType}
                onValueChange={(val) => {
                  setEntityType(val as "client" | "employee" | "");
                  setSelectedEntityId("");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General (No Link)</SelectItem>
                  <SelectItem value="client">Client Documents</SelectItem>
                  <SelectItem value="employee">Employee Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {entityType && (
              <div>
                <label className="text-sm font-medium text-slate-700">
                  {entityType === "client" ? "Select Client" : "Select Employee"}
                </label>
                <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`Select ${entityType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Bulk Upload Component */}
          <BulkDocumentUpload
            clientId={entityType === "client" ? selectedEntityId : undefined}
            employeeId={entityType === "employee" ? selectedEntityId : undefined}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface ComplianceItem {
  id: string;
  itemName: string;
  itemType: string;
}

interface DocumentUploadProps {
  clientId?: string;
  employeeId?: string;
  complianceItems?: ComplianceItem[];
  onUploadComplete?: () => void;
}

export function DocumentUpload({
  clientId,
  employeeId,
  complianceItems = [],
  onUploadComplete,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [complianceItemId, setComplianceItemId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Max 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError("");
      setSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(droppedFile);
      setError("");
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (clientId) formData.append("clientId", clientId);
      if (employeeId) formData.append("employeeId", employeeId);
      if (complianceItemId) formData.append("complianceItemId", complianceItemId);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setFile(null);
      setComplianceItemId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadComplete?.();

      // Reset success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            file ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 mb-2">
                Drag and drop a file here, or click to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                PDF, DOC, XLS, PNG, JPG up to 10MB
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {file && complianceItems.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">
              Link to Compliance Item (Optional)
            </label>
            <Select value={complianceItemId} onValueChange={setComplianceItemId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select compliance item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No link</SelectItem>
                {complianceItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.itemName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Document uploaded successfully
          </div>
        )}

        {file && (
          <div className="mt-4">
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

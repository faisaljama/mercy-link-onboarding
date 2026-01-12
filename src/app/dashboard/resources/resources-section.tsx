"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  FileText,
  Heart,
  Clipboard,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Plus,
  Download,
  ExternalLink,
  Trash2,
  Upload,
  Eye,
  Loader2,
  Search,
  X,
  Tag,
} from "lucide-react";
import { format } from "date-fns";

interface Resource {
  id: string;
  category: string;
  title: string;
  description: string | null;
  documentUrl: string;
  fileName: string;
  fileSize: number | null;
  tags: string | null;
  sortOrder: number;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string;
  };
}

// Department-based categories
const CATEGORY_CONFIG: Record<string, { label: string; description: string; icon: React.ElementType; color: string; bgColor: string }> = {
  HR: {
    label: "Human Resources",
    description: "Employee policies, onboarding, handbooks, evaluations",
    icon: Briefcase,
    color: "text-blue-700",
    bgColor: "bg-blue-100"
  },
  OPERATIONS: {
    label: "Operations",
    description: "Daily procedures, checklists, house protocols",
    icon: Clipboard,
    color: "text-green-700",
    bgColor: "bg-green-100"
  },
  COMPLIANCE: {
    label: "Compliance",
    description: "DHS forms, licensing, state requirements",
    icon: Shield,
    color: "text-red-700",
    bgColor: "bg-red-100"
  },
  TRAINING: {
    label: "Training",
    description: "Training materials, guides, certifications",
    icon: GraduationCap,
    color: "text-purple-700",
    bgColor: "bg-purple-100"
  },
  CLINICAL: {
    label: "Clinical",
    description: "Client forms, service agreements, care plans",
    icon: Heart,
    color: "text-pink-700",
    bgColor: "bg-pink-100"
  },
  GENERAL: {
    label: "General",
    description: "Company-wide policies, miscellaneous",
    icon: FolderOpen,
    color: "text-slate-700",
    bgColor: "bg-slate-100"
  },
};

const CATEGORY_ORDER = ["HR", "OPERATIONS", "COMPLIANCE", "TRAINING", "CLINICAL", "GENERAL"];

// Suggested tags for quick filtering
const SUGGESTED_TAGS = [
  "Policy", "Form", "Template", "Checklist", "Guide",
  "Training", "DHS", "Renewal", "New Hire", "Annual"
];

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourcesSection({
  resourcesByCategory,
  isAdmin,
}: {
  resourcesByCategory: Record<string, Resource[]>;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    documentUrl: "",
    fileName: "",
    fileSize: 0,
    tags: "",
  });

  // Filter resources based on search, category, and tag
  const getFilteredResources = () => {
    const filtered: Record<string, Resource[]> = {};

    for (const [category, resources] of Object.entries(resourcesByCategory)) {
      // Skip if filtering by category and this isn't it
      if (selectedCategory !== "all" && category !== selectedCategory) continue;

      const filteredResources = resources.filter(resource => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            resource.title.toLowerCase().includes(query) ||
            (resource.description?.toLowerCase().includes(query)) ||
            (resource.tags?.toLowerCase().includes(query)) ||
            resource.fileName.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // Tag filter
        if (selectedTag) {
          if (!resource.tags?.toLowerCase().includes(selectedTag.toLowerCase())) return false;
        }

        return true;
      });

      if (filteredResources.length > 0) {
        filtered[category] = filteredResources;
      }
    }

    return filtered;
  };

  const filteredResourcesByCategory = getFilteredResources();
  const totalFilteredCount = Object.values(filteredResourcesByCategory).reduce((acc, arr) => acc + arr.length, 0);
  const totalCount = Object.values(resourcesByCategory).reduce((acc, arr) => acc + arr.length, 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a PDF or Word document");
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB");
      return;
    }

    setSelectedFile(file);
    setFormData({
      ...formData,
      title: formData.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      fileName: file.name,
      fileSize: file.size,
    });
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.title || !selectedFile) {
      alert("Please fill in all required fields and select a file");
      return;
    }

    setLoading(true);
    setUploading(true);
    try {
      // First upload the file
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("type", "resource");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        alert(error.error || "Failed to upload file");
        return;
      }

      const uploadResult = await uploadResponse.json();

      // Then create the resource record
      const response = await fetch("/api/hub/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          title: formData.title,
          description: formData.description,
          tags: formData.tags || null,
          documentUrl: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        }),
      });

      if (!response.ok) {
        alert("Failed to add resource");
        return;
      }

      setUploadDialogOpen(false);
      setFormData({ category: "", title: "", description: "", documentUrl: "", fileName: "", fileSize: 0, tags: "" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      alert("Failed to add resource");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleViewDocument = (resource: Resource) => {
    setViewingResource(resource);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const response = await fetch(`/api/hub/resources/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete resource");
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to delete resource");
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Viewer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingResource?.title}</DialogTitle>
            <DialogDescription>
              {viewingResource?.description || viewingResource?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            {viewingResource?.documentUrl && (
              viewingResource.documentUrl.endsWith(".pdf") || viewingResource.fileName.endsWith(".pdf") ? (
                <iframe
                  src={viewingResource.documentUrl}
                  className="w-full h-[60vh] border rounded-lg"
                  title={viewingResource.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-50 rounded-lg">
                  <FileText className="h-16 w-16 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">This document cannot be previewed in the browser.</p>
                  <a href={viewingResource.documentUrl} download>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
                    </Button>
                  </a>
                </div>
              )
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <a href={viewingResource?.documentUrl} download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </a>
            <a href={viewingResource?.documentUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {CATEGORY_ORDER.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick Tag Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <Tag className="h-4 w-4 text-slate-400" />
                {SUGGESTED_TAGS.slice(0, 5).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedCategory !== "all" || selectedTag) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}

              {/* Results Count */}
              <span className="text-sm text-slate-500 ml-auto">
                {totalFilteredCount === totalCount
                  ? `${totalCount} document${totalCount !== 1 ? "s" : ""}`
                  : `${totalFilteredCount} of ${totalCount} documents`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
            setUploadDialogOpen(open);
            if (!open) {
              setSelectedFile(null);
              setFormData({ category: "", title: "", description: "", documentUrl: "", fileName: "", fileSize: 0, tags: "" });
              if (fileInputRef.current) fileInputRef.current.value = "";
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Upload a PDF or document to the resource hub
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload File *</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      selectedFile ? "border-green-300 bg-green-50" : "border-slate-300 hover:border-blue-400"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <FileText className="h-6 w-6" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p>Click to upload PDF or Word document</p>
                        <p className="text-xs mt-1">Max file size: 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Abuse Prevention Policy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the resource"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., Policy, Template, DHS, New Hire"
                  />
                  <p className="text-xs text-slate-500">Separate tags with commas for easier searching</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading || !selectedFile}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploading ? "Uploading..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resource
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {CATEGORY_ORDER.map((categoryKey) => {
        const resources = filteredResourcesByCategory[categoryKey];
        if (!resources || resources.length === 0) return null;

        const config = CATEGORY_CONFIG[categoryKey];
        const Icon = config.icon;

        return (
          <Card key={categoryKey}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div>
                  <CardTitle>{config.label}</CardTitle>
                  <CardDescription>
                    {config.description}
                    <span className="ml-2 text-slate-400">({resources.length} document{resources.length !== 1 ? "s" : ""})</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-xs text-slate-500">
                              {resource.fileName}
                              {resource.fileSize && ` (${formatFileSize(resource.fileSize)})`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {resource.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {format(new Date(resource.uploadedAt), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(resource)}
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <a href={resource.documentUrl} download title="Download">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(resource.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {Object.keys(filteredResourcesByCategory).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            {totalCount === 0 ? (
              <>
                <p>No resources available yet</p>
                {isAdmin && (
                  <p className="text-sm mt-2">Click &quot;Add Resource&quot; to add your first document</p>
                )}
              </>
            ) : (
              <>
                <p>No documents match your search</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

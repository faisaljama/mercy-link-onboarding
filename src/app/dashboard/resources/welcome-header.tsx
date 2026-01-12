"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  FolderOpen,
  Video,
  Pencil,
  Loader2,
} from "lucide-react";

interface WelcomeHeaderProps {
  title: string;
  description: string;
  totalDocuments: number;
  totalCategories: number;
  totalTutorials: number;
  isAdmin: boolean;
}

export function WelcomeHeader({
  title,
  description,
  totalDocuments,
  totalCategories,
  totalTutorials,
  isAdmin,
}: WelcomeHeaderProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title,
    description,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: "resourceHub.welcomeTitle", value: formData.title },
            { key: "resourceHub.welcomeDescription", value: formData.description },
          ],
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        router.refresh();
      } else {
        alert("Failed to save changes");
      }
    } catch {
      alert("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white relative">
      {isAdmin && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Welcome Section</DialogTitle>
              <DialogDescription>
                Customize the welcome message for your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeTitle">Title</Label>
                <Input
                  id="welcomeTitle"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Welcome to the Resource Hub"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcomeDescription">Description</Label>
                <Textarea
                  id="welcomeDescription"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Your central destination for compliance resources..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-3">{title}</h1>
        <p className="text-blue-100 text-lg leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <FileText className="h-5 w-5" />
            <span>{totalDocuments} Documents</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <FolderOpen className="h-5 w-5" />
            <span>{totalCategories} Departments</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <Video className="h-5 w-5" />
            <span>{totalTutorials} Tutorials</span>
          </div>
        </div>
      </div>
    </div>
  );
}

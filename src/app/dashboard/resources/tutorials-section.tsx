"use client";

import { useState } from "react";
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
  Video,
  Plus,
  Play,
  Clock,
  Trash2,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  embedUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  sortOrder: number;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
}

function getEmbedUrl(url: string): string {
  // Handle YouTube URLs
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      const urlParams = new URL(url).searchParams;
      videoId = urlParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/embed/")) {
      return url; // Already an embed URL
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Handle Vimeo URLs
  if (url.includes("vimeo.com")) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }

  // Handle Scribe URLs (already embed-ready or use as-is)
  if (url.includes("scribehow.com")) {
    return url;
  }

  // Return as-is for other embed URLs
  return url;
}

export function TutorialsSection({
  tutorials,
  isAdmin,
}: {
  tutorials: Tutorial[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    embedUrl: "",
    duration: "",
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.embedUrl) {
      alert("Please fill in title and embed URL");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/hub/tutorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          embedUrl: getEmbedUrl(formData.embedUrl),
        }),
      });

      if (!response.ok) {
        alert("Failed to add tutorial");
        return;
      }

      setAddDialogOpen(false);
      setFormData({ title: "", description: "", embedUrl: "", duration: "" });
      router.refresh();
    } catch {
      alert("Failed to add tutorial");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tutorial?")) return;

    try {
      const response = await fetch(`/api/hub/tutorials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete tutorial");
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to delete tutorial");
    }
  };

  const openTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Training Tutorials</h2>
          <p className="text-sm text-slate-500">
            Video guides and walkthroughs for Mercy Link procedures
          </p>
        </div>
        {isAdmin && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tutorial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Tutorial</DialogTitle>
                <DialogDescription>
                  Add a video tutorial or Scribe walkthrough
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., How to Complete Progress Notes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this tutorial covers"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embedUrl">Video URL *</Label>
                  <Input
                    id="embedUrl"
                    value={formData.embedUrl}
                    onChange={(e) => setFormData({ ...formData, embedUrl: e.target.value })}
                    placeholder="YouTube, Vimeo, or Scribe URL"
                  />
                  <p className="text-xs text-slate-500">
                    Supports YouTube, Vimeo, and Scribe embed URLs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 5:30"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Adding..." : "Add Tutorial"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tutorials.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <Card
              key={tutorial.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openTutorial(tutorial)}
            >
              <CardContent className="p-0">
                {/* Thumbnail/Preview area */}
                <div className="relative bg-gradient-to-br from-purple-100 to-indigo-100 h-40 flex items-center justify-center rounded-t-lg">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-7 w-7 text-purple-600 ml-1" />
                    </div>
                  </div>
                  <GraduationCap className="h-16 w-16 text-purple-300" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-1">{tutorial.title}</h3>
                  {tutorial.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {tutorial.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      {tutorial.duration && (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>{tutorial.duration}</span>
                        </>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tutorial.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Video className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p>No tutorials available yet</p>
            {isAdmin && (
              <p className="text-sm mt-2">Click &quot;Add Tutorial&quot; to add your first video</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video Player Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTutorial?.title}</DialogTitle>
            {selectedTutorial?.description && (
              <DialogDescription>{selectedTutorial.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
            {selectedTutorial && (
              <iframe
                src={getEmbedUrl(selectedTutorial.embedUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

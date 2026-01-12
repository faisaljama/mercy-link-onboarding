"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Settings,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { NotificationPreferences } from "@/components/notification-preferences";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=100");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.isRead)
          .map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "POST" }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleGenerateNotifications = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/notifications/generate");
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to generate notifications:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "OVERDUE":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "DEADLINE_WARNING":
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case "DEADLINE_WARNING":
        return <Badge className="bg-orange-100 text-orange-800">Upcoming</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">System</Badge>;
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);
  const overdueNotifications = notifications.filter((n) => n.type === "OVERDUE");
  const upcomingNotifications = notifications.filter((n) => n.type === "DEADLINE_WARNING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500">Stay on top of compliance deadlines</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateNotifications}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Checking..." : "Check Deadlines"}
          </Button>
          {unreadNotifications.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Unread</p>
                <p className="text-2xl font-bold">{unreadNotifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue Alerts</p>
                <p className="text-2xl font-bold text-red-600">{overdueNotifications.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Upcoming</p>
                <p className="text-2xl font-bold text-orange-600">{upcomingNotifications.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferences />

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Click a notification to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-red-600">
                Overdue ({overdueNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingNotifications.length})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="py-8 text-center text-slate-500">Loading...</div>
            ) : (
              <>
                <TabsContent value="all" className="mt-4">
                  <NotificationList
                    notifications={notifications}
                    onMarkRead={handleMarkAsRead}
                    onClick={handleClick}
                    getTypeIcon={getTypeIcon}
                    getTypeBadge={getTypeBadge}
                  />
                </TabsContent>

                <TabsContent value="unread" className="mt-4">
                  <NotificationList
                    notifications={unreadNotifications}
                    onMarkRead={handleMarkAsRead}
                    onClick={handleClick}
                    getTypeIcon={getTypeIcon}
                    getTypeBadge={getTypeBadge}
                  />
                </TabsContent>

                <TabsContent value="overdue" className="mt-4">
                  <NotificationList
                    notifications={overdueNotifications}
                    onMarkRead={handleMarkAsRead}
                    onClick={handleClick}
                    getTypeIcon={getTypeIcon}
                    getTypeBadge={getTypeBadge}
                  />
                </TabsContent>

                <TabsContent value="upcoming" className="mt-4">
                  <NotificationList
                    notifications={upcomingNotifications}
                    onMarkRead={handleMarkAsRead}
                    onClick={handleClick}
                    getTypeIcon={getTypeIcon}
                    getTypeBadge={getTypeBadge}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationList({
  notifications,
  onMarkRead,
  onClick,
  getTypeIcon,
  getTypeBadge,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClick: (notification: Notification) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeBadge: (type: string) => React.ReactNode;
}) {
  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        No notifications in this category
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
            !notification.isRead ? "bg-blue-50 border-blue-200" : ""
          }`}
          onClick={() => onClick(notification)}
        >
          <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`font-medium ${!notification.isRead ? "text-slate-900" : "text-slate-700"}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
              </div>
              {getTypeBadge(notification.type)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              {" • "}
              {format(new Date(notification.createdAt), "MMM d, h:mm a")}
            </p>
          </div>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  User,
  Home,
  Trash2,
  Edit2,
  Repeat,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

type EventType = "STAFF_MEETING" | "CARE_MEETING" | "APPOINTMENT" | "ACTIVITY" | "TRAINING" | "MEDICAL" | "MAINTENANCE" | "OTHER";
type RecurrenceType = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY";

interface CalendarEvent {
  id: string;
  houseId: string;
  clientId: string | null;
  eventType: EventType;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  isRecurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceEndDate: string | null;
  parentEventId: string | null;
  house: { id: string; name: string };
  client: { id: string; firstName: string; lastName: string } | null;
  createdBy: { id: string; name: string };
  parentEvent?: { id: string; title: string } | null;
}

// Recurrence type labels
const RECURRENCE_TYPES: Record<RecurrenceType, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 Weeks",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// Event type configuration with colors and labels
const EVENT_TYPES: Record<EventType, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  STAFF_MEETING: { label: "Staff Meeting", bgColor: "bg-purple-100", textColor: "text-purple-800", borderColor: "border-purple-300" },
  CARE_MEETING: { label: "Care Meeting", bgColor: "bg-pink-100", textColor: "text-pink-800", borderColor: "border-pink-300" },
  APPOINTMENT: { label: "Appointment", bgColor: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-300" },
  ACTIVITY: { label: "Activity", bgColor: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300" },
  TRAINING: { label: "Training", bgColor: "bg-amber-100", textColor: "text-amber-800", borderColor: "border-amber-300" },
  MEDICAL: { label: "Medical", bgColor: "bg-red-100", textColor: "text-red-800", borderColor: "border-red-300" },
  MAINTENANCE: { label: "Maintenance", bgColor: "bg-slate-100", textColor: "text-slate-800", borderColor: "border-slate-300" },
  OTHER: { label: "Other", bgColor: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-300" },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    houseId: "",
    clientId: "",
    eventType: "APPOINTMENT" as EventType,
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    isRecurring: false,
    recurrenceType: "" as RecurrenceType | "",
    recurrenceEndDate: "",
  });

  useEffect(() => {
    fetchHouses();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedHouse]);

  useEffect(() => {
    if (formData.houseId) {
      fetchClients(formData.houseId);
    }
  }, [formData.houseId]);

  const fetchHouses = async () => {
    try {
      const res = await fetch("/api/houses");
      if (res.ok) {
        const data = await res.json();
        setHouses(data.houses || []);
        if (data.houses?.length > 0) {
          setFormData((prev) => ({ ...prev, houseId: data.houses[0].id }));
        }
      }
    } catch (error) {
      console.error("Error fetching houses:", error);
    }
  };

  const fetchClients = async (houseId: string) => {
    try {
      const res = await fetch(`/api/clients?houseId=${houseId}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      let url = `/api/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      if (selectedHouse !== "all") {
        url += `&houseId=${selectedHouse}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setEditingEvent(null);
    setFormData({
      houseId: houses[0]?.id || "",
      clientId: "",
      eventType: "APPOINTMENT" as EventType,
      title: "",
      description: "",
      location: "",
      startDate: format(day, "yyyy-MM-dd"),
      startTime: "09:00",
      endDate: "",
      endTime: "",
      allDay: false,
      isRecurring: false,
      recurrenceType: "",
      recurrenceEndDate: "",
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      houseId: event.houseId,
      clientId: event.clientId || "",
      eventType: event.eventType,
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
      startTime: event.allDay ? "" : format(new Date(event.startDate), "HH:mm"),
      endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd") : "",
      endTime: event.endDate && !event.allDay ? format(new Date(event.endDate), "HH:mm") : "",
      allDay: event.allDay,
      isRecurring: event.isRecurring,
      recurrenceType: event.recurrenceType || "",
      recurrenceEndDate: event.recurrenceEndDate ? format(new Date(event.recurrenceEndDate), "yyyy-MM-dd") : "",
    });
    fetchClients(event.houseId);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.houseId || !formData.startDate) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = formData.allDay
        ? new Date(formData.startDate)
        : new Date(`${formData.startDate}T${formData.startTime || "00:00"}`);

      let endDateTime = null;
      if (formData.endDate) {
        endDateTime = formData.allDay
          ? new Date(formData.endDate)
          : new Date(`${formData.endDate}T${formData.endTime || "23:59"}`);
      }

      const payload = {
        houseId: formData.houseId,
        clientId: formData.clientId || null,
        eventType: formData.eventType,
        title: formData.title,
        description: formData.description || null,
        location: formData.location || null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString() || null,
        allDay: formData.allDay,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate
          ? new Date(formData.recurrenceEndDate).toISOString()
          : null,
      };

      const url = editingEvent ? `/api/calendar/${editingEvent.id}` : "/api/calendar";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save event");
      }
    } catch {
      alert("Error saving event");
    }
    setSubmitting(false);
  };

  const handleDelete = async (deleteAll: boolean = false) => {
    if (!editingEvent) return;

    const message = editingEvent.isRecurring && deleteAll
      ? "Delete this event and ALL future occurrences?"
      : editingEvent.parentEventId
        ? "Delete this single occurrence?"
        : "Are you sure you want to delete this event?";

    if (!confirm(message)) return;

    try {
      const url = deleteAll
        ? `/api/calendar/${editingEvent.id}?deleteAll=true`
        : `/api/calendar/${editingEvent.id}`;

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch {
      alert("Error deleting event");
    }
  };

  // Calendar grid helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startDate), day));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">House Calendar</h1>
          <p className="text-slate-500">
            Manage appointments and activities for residents
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedHouse} onValueChange={setSelectedHouse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Houses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Houses</SelectItem>
              {houses.map((house) => (
                <SelectItem key={house.id} value={house.id}>
                  {house.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              {format(currentDate, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-slate-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] p-2 cursor-pointer transition-colors ${
                    isCurrentMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50"
                  } ${isToday(day) ? "ring-2 ring-blue-500 ring-inset" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentMonth ? "text-slate-900" : "text-slate-400"
                      } ${isToday(day) ? "bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center" : ""}`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayClick(day);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const eventConfig = EVENT_TYPES[event.eventType] || EVENT_TYPES.OTHER;
                      const isRecurring = event.isRecurring || event.parentEventId;
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${eventConfig.bgColor} ${eventConfig.textColor} flex items-center gap-1`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          {isRecurring && <Repeat className="h-3 w-3 flex-shrink-0" />}
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            {Object.entries(EVENT_TYPES).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${config.bgColor} border ${config.borderColor}`} />
                <span className="text-slate-600">{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingEvent ? "Edit Event" : "New Event"}
              {selectedDay && !editingEvent && ` - ${format(selectedDay, "MMMM d, yyyy")}`}
              {editingEvent?.isRecurring && (
                <Badge variant="outline" className="ml-2 text-purple-600 border-purple-300">
                  <Repeat className="h-3 w-3 mr-1" />
                  Recurring
                </Badge>
              )}
              {editingEvent?.parentEventId && (
                <Badge variant="outline" className="ml-2 text-slate-600">
                  Part of series
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(v) => setFormData({ ...formData, houseId: v, clientId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select house" />
                  </SelectTrigger>
                  <SelectContent>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(v) => setFormData({ ...formData, eventType: v as EventType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Client (optional)</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => setFormData({ ...formData, clientId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="House-wide event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">House-wide event</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Doctor Appointment, House BBQ"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allDay: checked === true })
                  }
                />
                <Label htmlFor="allDay">All day</Label>
              </div>
              {!editingEvent && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isRecurring: checked === true,
                        recurrenceType: checked ? "WEEKLY" : "",
                      })
                    }
                  />
                  <Label htmlFor="isRecurring" className="flex items-center gap-1">
                    <Repeat className="h-4 w-4" />
                    Recurring
                  </Label>
                </div>
              )}
            </div>

            {formData.isRecurring && !editingEvent && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border">
                <div>
                  <Label>Repeat</Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(v) => setFormData({ ...formData, recurrenceType: v as RecurrenceType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Until (optional)</Label>
                  <Input
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                    min={formData.startDate}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              {!formData.allDay && (
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              {!formData.allDay && (
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Clinic Name, Park Name"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                rows={2}
              />
            </div>

            <div className="flex justify-between">
              {editingEvent && (
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" onClick={() => handleDelete(false)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  {editingEvent.isRecurring && (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(true)}
                    >
                      Delete All
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingEvent ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

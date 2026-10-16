"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, FilePenLine, Loader2, PlusCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EventValues = {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  date: string;
  month: string;
  fullDate: string;
  day: string;
  time: string;
  location: string;
  mode: string;
  speaker: string;
  designation: string;
  description: string;
  eventUrl: string;
};

type EventRecord = EventValues;
type OtherField = Exclude<keyof EventValues, "id" | "title" | "date" | "month" | "fullDate" | "day" | "time" | "description" | "eventUrl">;
type FieldDefinition = { name: OtherField; label: string; maxLength: number; placeholder?: string; options?: readonly string[] };

const eventFields = [
  "title", "shortTitle", "category", "date", "month", "fullDate", "day", "time",
  "location", "mode", "speaker", "designation", "description", "eventUrl",
] as const satisfies readonly (keyof EventValues)[];

const requiredFields = [
  ["title", "Event title"],
  ["shortTitle", "Short title"],
  ["category", "Category"],
  ["location", "Location"],
  ["mode", "Mode"],
  ["speaker", "Speaker"],
  ["designation", "Designation"],
  ["description", "Description"],
  ["eventUrl", "Event URL"],
] as const satisfies readonly (readonly [keyof EventValues, string])[];

const categories = ["Workshop", "Webinar", "Conference", "Seminar"] as const;
const modes = ["Online", "Offline"] as const;
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const emptyEvent: EventValues = {
  id: "",
  title: "",
  shortTitle: "",
  category: "",
  date: "",
  month: "",
  fullDate: "",
  day: "",
  time: "",
  location: "",
  mode: "",
  speaker: "",
  designation: "",
  description: "",
  eventUrl: "",
};

const fieldGroups: { heading: string; fields: FieldDefinition[] }[] = [
  {
    heading: "Event details",
    fields: [
      { name: "shortTitle", label: "Short title", maxLength: 200 },
      { name: "category", label: "Category", maxLength: 100, options: categories },
    ],
  },
  {
    heading: "Schedule and place",
    fields: [
      { name: "location", label: "Location", maxLength: 200, placeholder: "New Delhi, India" },
      { name: "mode", label: "Mode", maxLength: 50, options: modes },
    ],
  },
  {
    heading: "Presenter",
    fields: [
      { name: "speaker", label: "Speaker", maxLength: 200 },
      { name: "designation", label: "Designation", maxLength: 200 },
    ],
  },
];

function dateFieldsFromPicker(value: string): Pick<EventValues, "date" | "month" | "fullDate" | "day"> | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const dayNumber = Number(match[3]);
  const selected = new Date(0);
  selected.setUTCFullYear(year, monthIndex, dayNumber);
  if (selected.getUTCFullYear() !== year || selected.getUTCMonth() !== monthIndex || selected.getUTCDate() !== dayNumber) {
    return null;
  }
  return {
    date: String(dayNumber),
    month: monthNames[monthIndex].slice(0, 3).toUpperCase(),
    fullDate: `${dayNumber} ${monthNames[monthIndex]} ${year}`,
    day: dayNames[selected.getUTCDay()],
  };
}

function datePickerValue(event?: EventRecord): string {
  if (!event?.fullDate) return "";
  const fullDate = event.fullDate.trim();
  if (dateFieldsFromPicker(fullDate)) return fullDate;
  const match = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(fullDate);
  if (!match) return "";
  const monthIndex = monthNames.findIndex((month) =>
    month.toLowerCase() === match[2].toLowerCase() || month.slice(0, 3).toLowerCase() === match[2].toLowerCase(),
  );
  if (monthIndex < 0) return "";
  const value = `${match[3]}-${String(monthIndex + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return dateFieldsFromPicker(value) ? value : "";
}

function parseClock(value: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(value.trim());
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return "";
  if (match[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function timePickerValues(value: string): { start: string; end: string } {
  const parts = value.trim().split(/\s*[–—-]\s*/);
  if (!value.trim() || parts.length > 2) return { start: "", end: "" };
  const start = parseClock(parts[0]);
  const end = parts.length === 2 ? parseClock(parts[1]) : "";
  return start && (parts.length === 1 || end) ? { start, end } : { start: "", end: "" };
}

function eventTimeFromPicker(start: string, end: string): string {
  const format = (value: string) => {
    const [hours, minutes] = value.split(":");
    const hour = Number(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
  };
  return start ? `${format(start)}${end ? ` – ${format(end)}` : ""}` : "";
}

function validateEvent(values: EventValues, selectedDate: string, startTime: string, endTime: string, editing: boolean): string {
  for (const [field, label] of requiredFields) {
    if (!values[field].trim()) return `${label} is required.`;
  }
  if (!selectedDate || !dateFieldsFromPicker(selectedDate)) return "Event date is required.";
  if (!startTime) return "Start time is required.";
  if (!endTime) return "End time is required.";
  if (!editing && values.id.trim() && !/^[a-zA-Z0-9_-]{1,120}$/.test(values.id.trim())) {
    return "Event ID can contain only letters, numbers, underscores, and hyphens.";
  }
  try {
    const url = new URL(values.eventUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
  } catch {
    return "Event URL must start with http:// or https://.";
  }
  return "";
}

function displayDate(event: EventRecord): string {
  return event.fullDate || [event.date, event.month].filter(Boolean).join(" ");
}

function EventFormDialog({
  event,
  onSaved,
  children,
}: {
  event?: EventRecord;
  onSaved: (saved: EventRecord) => void;
  children: ReactNode;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<EventValues>(emptyEvent);
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const submitting = useRef(false);

  function handleOpenChange(nextOpen: boolean) {
    if (submitting.current) return;
    if (nextOpen) {
      setValues(event ? {
        ...emptyEvent,
        ...Object.fromEntries(eventFields.map((field) => [field, typeof event[field] === "string" ? event[field] : ""])),
        id: event.id,
      } : { ...emptyEvent });
      setSelectedDate(datePickerValue(event));
      const selectedTime = timePickerValues(event?.time ?? "");
      setStartTime(selectedTime.start);
      setEndTime(selectedTime.end);
      setSaveError("");
    }
    setOpen(nextOpen);
  }

  function setField(name: keyof EventValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (saveError) setSaveError("");
  }

  function changeDate(value: string) {
    const fields = value ? dateFieldsFromPicker(value) : { date: "", month: "", fullDate: "", day: "" };
    if (!fields) {
      setSaveError("Choose a valid date.");
      return;
    }
    setSelectedDate(value);
    setValues((current) => ({ ...current, ...fields }));
    setSaveError("");
  }

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!value) setEndTime("");
    setField("time", eventTimeFromPicker(value, value ? endTime : ""));
  }

  function changeEndTime(value: string) {
    setEndTime(value);
    setField("time", eventTimeFromPicker(startTime, value));
  }

  async function handleSave(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (submitting.current) return;

    const error = validateEvent(values, selectedDate, startTime, endTime, Boolean(event));
    if (error) {
      setSaveError(error);
      return;
    }

    const normalizedValues = {
      ...values,
      ...dateFieldsFromPicker(selectedDate),
      time: eventTimeFromPicker(startTime, endTime),
    };
    const trimmedFields = Object.fromEntries(
      eventFields.map((field) => [field, normalizedValues[field].trim()]),
    );
    if (event && eventFields.every((field) => trimmedFields[field] === (event[field] ?? ""))) {
      setSaveError("Change at least one field before saving.");
      return;
    }
    const payload = { ...trimmedFields, ...(!event && values.id.trim() ? { id: values.id.trim() } : {}) };

    submitting.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(
        event ? `/api/events/${encodeURIComponent(event.id)}` : "/api/events",
        {
          method: event ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.id) {
        throw new Error(result?.message || `Could not ${event ? "update" : "create"} the event.`);
      }

      onSaved(result as EventRecord);
      toast.success(event ? "Event updated." : "Event created.");
      setOpen(false);
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : "Could not save the event.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "Add event"}</DialogTitle>
          <DialogDescription>
            {event ? "Update event details. The event ID stays the same." : "Add an event to the public event list."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6" aria-busy={saving}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`${fieldId}-title`}>Title *</Label>
              <Input
                id={`${fieldId}-title`}
                value={values.title}
                onChange={(changeEvent) => setField("title", changeEvent.target.value)}
                maxLength={200}
                required
                disabled={saving}
                placeholder="Advanced Endodontics Masterclass"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 hidden">
              <Label htmlFor={`${fieldId}-id`}>Event ID {event ? "" : "(optional)"}</Label>
              <Input
                id={`${fieldId}-id`}
                value={values.id}
                onChange={(changeEvent) => setField("id", changeEvent.target.value)}
                maxLength={120}
                readOnly={Boolean(event)}
                disabled={saving}
                placeholder="Generated automatically if blank"
              />
              {!event && <p className="text-xs text-muted-foreground">Use letters, numbers, underscores, or hyphens.</p>}
            </div>
          </div>

          {fieldGroups.map((group) => (
            <section key={group.heading} className="space-y-3">
              <h3 className="text-sm font-semibold">{group.heading}</h3>
              {group.heading === "Schedule and place" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-event-date`}>Event date *</Label>
                    <Input
                      id={`${fieldId}-event-date`}
                      type="date"
                      value={selectedDate}
                      onChange={(changeEvent) => changeDate(changeEvent.target.value)}
                      required
                      disabled={saving}
                    />
                    {!selectedDate && displayDate(values) && (
                      <p className="text-xs text-muted-foreground">Current date: {displayDate(values)}. Choose a date to replace it.</p>
                    )}
                    {displayDate(values) && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => changeDate("")} disabled={saving}>Clear date</Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-start-time`}>Start time *</Label>
                    <Input
                      id={`${fieldId}-start-time`}
                      type="time"
                      value={startTime}
                      onChange={(changeEvent) => changeStartTime(changeEvent.target.value)}
                      required
                      disabled={saving}
                    />
                    {values.time && !startTime && (
                      <p className="text-xs text-muted-foreground">Current time: {values.time}. Choose a start time to replace it.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-end-time`}>End time *</Label>
                    <Input
                      id={`${fieldId}-end-time`}
                      type="time"
                      value={endTime}
                      onChange={(changeEvent) => changeEndTime(changeEvent.target.value)}
                      required
                      disabled={saving || !startTime}
                    />
                    {values.time && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => changeStartTime("")} disabled={saving}>Clear time</Button>
                    )}
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={`${fieldId}-${field.name}`}>{field.label} *</Label>
                    {field.options ? (
                      <select
                        id={`${fieldId}-${field.name}`}
                        value={values[field.name]}
                        onChange={(changeEvent) => setField(field.name, changeEvent.target.value)}
                        required
                        disabled={saving}
                        className="flex h-11 min-w-0 w-full rounded-md border border-input bg-card px-3 py-2 text-base transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {values[field.name] && !field.options.includes(values[field.name]) && (
                          <option value={values[field.name]}>{values[field.name]} (current)</option>
                        )}
                        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <Input
                        id={`${fieldId}-${field.name}`}
                        value={values[field.name]}
                        onChange={(changeEvent) => setField(field.name, changeEvent.target.value)}
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        required
                        disabled={saving}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">Description and link</h3>
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-description`}>Description *</Label>
              <Textarea
                id={`${fieldId}-description`}
                value={values.description}
                onChange={(changeEvent) => setField("description", changeEvent.target.value)}
                maxLength={5000}
                rows={4}
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-eventUrl`}>Event URL *</Label>
                <Input
                  id={`${fieldId}-eventUrl`}
                  type="url"
                  value={values.eventUrl}
                  onChange={(changeEvent) => setField("eventUrl", changeEvent.target.value)}
                  maxLength={2048}
                  placeholder="https://example.com/event"
                  required
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          {saveError && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{saveError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? "Saving..." : event ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EventManager() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const requestVersion = useRef(0);
  const deleteInProgress = useRef(false);

  const loadEvents = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error(result?.message || "Could not load events.");
      }
      if (version === requestVersion.current) setEvents(result.data as EventRecord[]);
    } catch (requestError) {
      if (version === requestVersion.current) {
        setLoadError(requestError instanceof Error ? requestError.message : "Could not load events.");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  function handleSaved(saved: EventRecord) {
    requestVersion.current += 1;
    setLoading(false);
    setLoadError("");
    setEvents((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current]);
  }

  async function handleDelete() {
    if (!deleteTarget || deleteInProgress.current) return;
    deleteInProgress.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Could not delete the event.");
      requestVersion.current += 1;
      setLoading(false);
      setLoadError("");
      setEvents((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Event deleted.");
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "Could not delete the event.");
    } finally {
      deleteInProgress.current = false;
      setDeleting(false);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleEvents = events.filter((event) =>
    [event.title, event.shortTitle, event.category, event.speaker,
      event.location, event.mode, event.fullDate, event.date, event.month, event.id]
      .some((value) => value?.toLowerCase().includes(query)),
  );

  return (
    <div className="page-content space-y-6">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-description">Create and manage the events shown in the app.</p>
        </div>
        <EventFormDialog onSaved={handleSaved}>
          <Button><PlusCircle className="h-4 w-4" aria-hidden="true" />Add event</Button>
        </EventFormDialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search events"
            type="search"
            value={search}
            onChange={(changeEvent) => setSearch(changeEvent.target.value)}
            placeholder="Search events"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">{visibleEvents.length} {visibleEvents.length === 1 ? "event" : "events"}</p>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadEvents()} disabled={loading}>Retry</Button>
        </div>
      )}

      {loading && !events.length ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center text-sm text-muted-foreground">Loading events...</div>
      ) : !visibleEvents.length ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          {loadError ? "Events could not be loaded." : query ? "No events match your search." : "No events found. Add an event to get started."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleEvents.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
              
                <div className="flex aspect-[2/1] items-center justify-center border-b bg-muted text-muted-foreground">
                  <CalendarDays className="h-9 w-9" aria-hidden="true" />
                </div>
             
              <div className="space-y-3 p-5" >
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{event.category || "Event"}</p>
                  <h2 className="break-words text-lg font-semibold">{event.title}</h2>
                  <p className="break-all text-xs text-muted-foreground">ID: {event.id}</p>
                </div>
                {(displayDate(event) || event.time || event.location || event.speaker) && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {(displayDate(event) || event.time) && <p>{[displayDate(event), event.time].filter(Boolean).join(" · ")}</p>}
                    {event.location && <p>{event.location}</p>}
                    {event.speaker && <p>Speaker: {event.speaker}</p>}
                  </div>
                )}
                <div className="flex justify-end gap-2 border-t pt-4">
                  <EventFormDialog event={event} onSaved={handleSaved}>
                    <Button size="sm" variant="outline" aria-label={`Edit event: ${event.title}`}>
                      <FilePenLine className="h-4 w-4" aria-hidden="true" />Edit
                    </Button>
                  </EventFormDialog>
                  <Button
                    size="sm"
                    variant="destructive"
                    aria-label={`Delete event: ${event.title}`}
                    onClick={() => { setDeleteError(""); setDeleteTarget(event); }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => { if (!nextOpen && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.title}&quot;? This event will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(clickEvent) => { clickEvent.preventDefault(); void handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {deleting ? "Deleting..." : "Delete event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

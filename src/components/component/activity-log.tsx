"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Activity, Clock3, Eye, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

type ActivityEntry = {
  _id: string;
  actor: { id: string; name: string; email: string; role: string };
  action: string;
  resource: string;
  summary: string;
  target: { id: string; label: string; ids: string[] };
  changedFields: string[];
  affectedCount?: number;
  outcome: "success" | "failed";
  statusCode: number;
  method: string;
  endpoint: string;
  createdAt: string;
};

const resources = ["product", "coupon", "order", "banner", "account", "role", "brand", "category", "cart", "address", "wishlist", "review", "payment", "enquiry", "upload"];
const actions: Record<string, string> = {
  create: "Created", update: "Updated", delete: "Deleted", publish: "Published", unpublish: "Unpublished",
  feature: "Featured", unfeature: "Unfeatured", sync: "Synchronized", import: "Imported", cancel: "Cancelled",
  remove: "Removed", login: "Signed in", logout: "Signed out", password_reset: "Password reset requested", password_change: "Password changed",
  verify: "Verified", send_verification: "Verification sent", export: "Exported",
};
const emptyFilters = { search: "", resource: "", action: "", outcome: "", actorRole: "", from: "", to: "" };
const selectClass = "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring/20";
const dateTime = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function ActivityLog() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ActivityEntry | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadActivity() {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ page: String(page), limit: "25" });
        for (const [key, value] of Object.entries(appliedFilters)) {
          if (!value) continue;
          query.set(key, key === "from" ? new Date(`${value}T00:00:00`).toISOString()
            : key === "to" ? new Date(`${value}T23:59:59.999`).toISOString() : value);
        }
        const response = await fetch(`/api/activity-logs?${query}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(result?.data)) throw new Error(result?.message || "Unable to load activity logs.");
        if (controller.signal.aborted) return;
        setEntries(result.data);
        setTotal(result.total);
        setPages(result.pages);
        setLastUpdated(new Date());
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load activity logs.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadActivity();
    return () => controller.abort();
  }, [page, appliedFilters, refresh]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) {
      setError("Choose an end date on or after the start date.");
      return;
    }
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  const hasFilters = Object.values(appliedFilters).some(Boolean);

  return (
    <div className="page-content space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-eyebrow mb-2">Administration</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Activity Log</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">See who did what across your platform. Review admin and customer actions, with a record of when they happened.</p>
        </div>
        <Button variant="outline" onClick={() => setRefresh(value => value + 1)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />Refresh
        </Button>
      </header>

      <form onSubmit={applyFilters} className="space-y-4 rounded-lg border bg-card p-4 shadow-sm sm:p-5" aria-label="Filter activity logs">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="activity-search">Search activity</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="activity-search" type="search" maxLength={160} placeholder="Name, email, product, coupon, or item ID…" className="pl-10" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-resource">Section</Label>
            <select id="activity-resource" className={selectClass} value={filters.resource} onChange={event => setFilters({ ...filters, resource: event.target.value })}>
              <option value="">All sections</option>{resources.map(resource => <option key={resource} value={resource}>{resource}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-action">Action</Label>
            <select id="activity-action" className={selectClass} value={filters.action} onChange={event => setFilters({ ...filters, action: event.target.value })}>
              <option value="">All actions</option>{Object.entries(actions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-actor">Performed by</Label>
            <select id="activity-actor" className={selectClass} value={filters.actorRole} onChange={event => setFilters({ ...filters, actorRole: event.target.value })}>
              <option value="">Everyone</option><option value="admin">Admins</option><option value="user">Customers</option><option value="guest">Guests / unauthenticated</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-outcome">Result</Label>
            <select id="activity-outcome" className={selectClass} value={filters.outcome} onChange={event => setFilters({ ...filters, outcome: event.target.value })}>
              <option value="">All results</option><option value="success">Successful</option><option value="failed">Failed</option>
            </select>
          </div>
          <div className="space-y-2"><Label htmlFor="activity-from">From date</Label><Input id="activity-from" type="date" value={filters.from} max={filters.to || undefined} onChange={event => setFilters({ ...filters, from: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="activity-to">To date</Label><Input id="activity-to" type="date" value={filters.to} min={filters.from || undefined} onChange={event => setFilters({ ...filters, to: event.target.value })} /></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs leading-5 text-muted-foreground">Times are shown in your local timezone. Logging starts when enabled.</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => { setFilters(emptyFilters); setAppliedFilters({ ...emptyFilters }); setPage(1); }}>Clear filters</Button>
            <Button type="submit" disabled={loading}>Apply filters</Button>
          </div>
        </div>
      </form>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><p>{error}</p><Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Try again</Button></div>}

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-sm" aria-busy={loading} aria-label="Recorded activity">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">{hasFilters ? "Filtered activity" : "Latest activity"} {!error && <span className="ml-2 text-sm font-normal tabular-nums text-muted-foreground">{total.toLocaleString()} events</span>}</h2>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Newest first"}</p>
        </div>
        {loading ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" />Loading activity…</div>
          : error ? <div className="px-5 py-12 text-center text-sm text-muted-foreground">Activity could not be loaded. Try again using the button above.</div>
          : entries.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center"><Activity className="mb-4 h-9 w-9 text-muted-foreground/60" aria-hidden="true" /><h3 className="font-semibold">{hasFilters ? "No matching activity" : "No activity recorded yet"}</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{hasFilters ? "Try another search or a wider date range." : "New platform actions will appear here after activity logging is enabled. Earlier actions are not available."}</p></div>
          : <Table>
            <TableHeader><TableRow><TableHead>Date & time</TableHead><TableHead>Activity</TableHead><TableHead>Performed by</TableHead><TableHead>Item</TableHead><TableHead>Result</TableHead><TableHead><span className="sr-only">Details</span></TableHead></TableRow></TableHeader>
            <TableBody>{entries.map(entry => <TableRow key={entry._id}>
              <TableCell className="min-w-[160px] tabular-nums"><time dateTime={entry.createdAt}>{dateTime(entry.createdAt)}</time></TableCell>
              <TableCell className="min-w-[180px]"><p className="font-medium">{entry.summary}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{entry.resource}{entry.affectedCount !== undefined ? ` · ${entry.affectedCount} items` : ""}</p></TableCell>
              <TableCell className="max-w-[240px] min-w-[170px]"><p className="break-words font-medium">{entry.actor.name}</p><p className="break-all text-xs text-muted-foreground">{entry.actor.email || (entry.actor.role === "guest" ? "Unauthenticated request" : entry.actor.role)}</p><span className="text-xs capitalize text-muted-foreground">{entry.actor.role === "user" ? "Customer" : entry.actor.role === "admin" ? "Admin" : ""}</span></TableCell>
              <TableCell className="max-w-[220px] min-w-[150px]"><p className="break-words">{entry.target.label || "—"}</p><p className="break-all text-xs text-muted-foreground">{entry.target.id}</p></TableCell>
              <TableCell><Badge variant={entry.outcome === "failed" ? "destructive" : "default"}>{entry.outcome === "success" ? "Success" : "Failed"}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" aria-label={`View details: ${entry.summary}`} onClick={() => setSelected(entry)}><Eye className="h-4 w-4" /></Button></TableCell>
            </TableRow>)}</TableBody>
          </Table>}
        {!error && <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 sm:px-5"><p className="text-sm tabular-nums text-muted-foreground">Page {page} of {pages}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={loading || page >= pages} onClick={() => setPage(value => value + 1)}>Next</Button></div></div>}
      </section>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Activity details</DialogTitle><DialogDescription>{selected?.summary}</DialogDescription></DialogHeader>
          {selected && <div className="space-y-5 text-sm">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3">
              <dt className="text-muted-foreground">Performed by</dt><dd className="break-words">{selected.actor.name}<span className="block break-all text-muted-foreground">{selected.actor.email}</span></dd>
              <dt className="text-muted-foreground">Date & time</dt><dd>{dateTime(selected.createdAt)}</dd>
              <dt className="text-muted-foreground">Item</dt><dd className="break-words">{selected.target.label || "—"}<span className="block break-all text-xs text-muted-foreground">{selected.target.id}</span></dd>
              <dt className="text-muted-foreground">Result</dt><dd>{selected.outcome === "success" ? "Success" : "Failed"} · HTTP {selected.statusCode}</dd>
              <dt className="text-muted-foreground">Request</dt><dd className="break-all font-mono text-xs leading-6">{selected.method} {selected.endpoint}</dd>
            </dl>
            {!!selected.changedFields.length && <div><h3 className="mb-2 font-medium">Submitted fields</h3><div className="flex flex-wrap gap-2">{selected.changedFields.map(field => <Badge key={field} variant="secondary">{field}</Badge>)}</div><p className="mt-2 text-xs text-muted-foreground">Field names are recorded; sensitive values are not stored.</p></div>}
            {!!selected.target.ids.length && <details><summary className="cursor-pointer font-medium">Affected item IDs{selected.affectedCount && selected.affectedCount > selected.target.ids.length ? ` (first ${selected.target.ids.length})` : ""}</summary><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{selected.target.ids.map(id => <li key={id} className="break-all">{id}</li>)}</ul></details>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

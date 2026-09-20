"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareWarning, Send } from "lucide-react";
import { toast } from "sonner";
import {
  fetchGuestMyComplaints,
  guestSubmitComplaint,
  type GuestComplaint,
} from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { PageHero } from "@/components/guest/page-hero";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "room", label: "Room" },
  { value: "cleanliness", label: "Cleanliness" },
  { value: "noise", label: "Noise" },
  { value: "service", label: "Service" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
] as const;

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "resolved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
  }
  if (s === "acknowledged") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function categoryLabel(value: string) {
  return (
    CATEGORIES.find((c) => c.value === value)?.label ||
    value.replace(/_/g, " ") ||
    "General"
  );
}

export default function ComplaintsPage() {
  const [items, setItems] = useState<GuestComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const data = await fetchGuestMyComplaints();
    setItems(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        toast.error(notifyError(e, "Could not load complaints"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please describe the issue");
      return;
    }
    setSubmitting(true);
    try {
      const created = await guestSubmitComplaint({
        category,
        message: trimmed,
      });
      setItems((prev) => [created, ...prev]);
      setMessage("");
      setCategory("general");
      toast.success("Complaint sent to reception");
    } catch (err) {
      toast.error(notifyError(err, "Could not submit complaint"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHero
        title="Complaints"
        description="Tell reception about something that needs attention during your stay."
        icon={<MessageSquareWarning className="size-5" />}
      />

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-rose-500/5 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="complaint-category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="complaint-category" className="w-full sm:max-w-xs">
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="complaint-message">What happened?</Label>
          <Textarea
            id="complaint-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue clearly so reception can help."
            rows={4}
            className="resize-y min-h-24"
            maxLength={4000}
          />
          <p className="text-xs text-muted-foreground">
            {message.trim().length}/4000
          </p>
        </div>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            <Spinner className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
          Submit complaint
        </Button>
      </form>

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            History
          </p>
          <h2 className="text-lg font-semibold tracking-tight">Your complaints</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Empty className="border border-dashed border-border/80 bg-card/50 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareWarning />
              </EmptyMedia>
              <EmptyTitle>No complaints yet</EmptyTitle>
              <EmptyDescription>
                When you submit one, it will appear here with its status.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-foreground">
                      {categoryLabel(item.category)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatWhen(item.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("capitalize", statusTone(item.status))}
                  >
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-pretty text-muted-foreground whitespace-pre-wrap">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

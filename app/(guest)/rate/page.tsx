"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
  fetchGuestMyRating,
  fetchGuestMyRatings,
  guestSubmitRating,
  type GuestRating,
} from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { PageHero } from "@/components/guest/page-hero";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

function ScorePicker({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number | null;
  onChange: (n: number) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-xl border transition-all",
                active
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-600 shadow-sm dark:text-amber-400"
                  : "border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              aria-label={`${label} ${n} of 5`}
              aria-pressed={value === n}
            >
              <Star
                className={cn("size-5", active && "fill-current")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function RateStayPage() {
  const [existing, setExisting] = useState<GuestRating | null>(null);
  const [history, setHistory] = useState<GuestRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overall, setOverall] = useState<number | null>(null);
  const [cleanliness, setCleanliness] = useState<number | null>(null);
  const [service, setService] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const applyRating = useCallback((rating: GuestRating | null) => {
    setExisting(rating);
    if (!rating) return;
    setOverall(rating.overall);
    setCleanliness(rating.cleanliness ?? null);
    setService(rating.service ?? null);
    setComment(rating.comment || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [current, all] = await Promise.all([
          fetchGuestMyRating(),
          fetchGuestMyRatings(),
        ]);
        if (cancelled) return;
        applyRating(current);
        setHistory(
          all.filter((r) => !current || r.id !== current.id),
        );
      } catch (e) {
        toast.error(notifyError(e, "Could not load rating"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyRating]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overall == null) {
      toast.error("Please choose an overall rating");
      return;
    }
    setSubmitting(true);
    try {
      const saved = await guestSubmitRating({
        overall,
        cleanliness: cleanliness ?? undefined,
        service: service ?? undefined,
        comment: comment.trim(),
      });
      applyRating(saved);
      toast.success(existing ? "Rating updated" : "Thanks for your rating");
    } catch (err) {
      toast.error(notifyError(err, "Could not save rating"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHero
        title="Rate stay"
        description="One rating per stay — you can update it anytime before checkout."
        icon={<Star className="size-5" />}
      />

      {!existing ? (
        <Empty className="border border-dashed border-border/80 bg-card/50 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Star />
            </EmptyMedia>
            <EmptyTitle>No rating yet</EmptyTitle>
            <EmptyDescription>
              Share how your stay felt. Reception uses this to improve service.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-muted-foreground">
          Last saved {formatWhen(existing.updatedAt)}. Submitting again will
          update your rating.
        </div>
      )}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-violet-500/5 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:p-5"
      >
        <ScorePicker
          label="Overall"
          value={overall}
          onChange={setOverall}
          required
        />
        <ScorePicker
          label="Cleanliness"
          value={cleanliness}
          onChange={setCleanliness}
        />
        <ScorePicker
          label="Service"
          value={service}
          onChange={setService}
        />
        <div className="space-y-2">
          <Label htmlFor="rate-comment">Comment (optional)</Label>
          <Textarea
            id="rate-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went well? What could be better?"
            rows={4}
            className="resize-y min-h-24"
            maxLength={2000}
          />
        </div>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Spinner className="size-4" /> : <Star className="size-4" />}
          {existing ? "Update rating" : "Submit rating"}
        </Button>
      </form>

      {history.length > 0 ? (
        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              History
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Past stay ratings
            </h2>
          </div>
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    Overall {item.overall}/5
                    {item.voucherCode ? (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {item.voucherCode}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
                {item.comment ? (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {item.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

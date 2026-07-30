"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Receipt,
  BedDouble,
  UtensilsCrossed,
  Shirt,
  CircleDot,
} from "lucide-react";
import { fetchGuestBill, type GuestBill } from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { formatEtb } from "@/components/guest/catalog";
import { PageHero } from "@/components/guest/page-hero";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const KIND_ORDER = ["room", "food_drink", "laundry", "other"] as const;

const KIND_META: Record<
  string,
  {
    label: string;
    icon: typeof Receipt;
    accent: string;
    iconTone: string;
    headerTone: string;
  }
> = {
  room: {
    label: "Room",
    icon: BedDouble,
    accent: "border-primary/25",
    iconTone: "bg-primary/15 text-primary",
    headerTone: "from-primary/10",
  },
  food_drink: {
    label: "Food & drink",
    icon: UtensilsCrossed,
    accent: "border-emerald-500/25",
    iconTone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    headerTone: "from-emerald-500/10",
  },
  laundry: {
    label: "Laundry",
    icon: Shirt,
    accent: "border-sky-500/25",
    iconTone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    headerTone: "from-sky-500/10",
  },
  other: {
    label: "Other",
    icon: CircleDot,
    accent: "border-border/70",
    iconTone: "bg-muted text-muted-foreground",
    headerTone: "from-muted/40",
  },
};

function cleanDescription(description: string) {
  return description.replace(/\s*·\s*#co:\d+\s*$/i, "").trim();
}

function formatLineWhen(iso: string | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "open" || s === "active") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
  if (s === "closed" || s === "paid" || s === "settled") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
  }
  return "border-border/70 bg-muted text-muted-foreground";
}

export default function BillPage() {
  const [bill, setBill] = useState<GuestBill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGuestBill();
        if (!cancelled) setBill(data);
      } catch (e) {
        toast.error(notifyError(e, "Could not load bill"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, NonNullable<GuestBill["lines"]>>();
    for (const line of bill?.lines || []) {
      const key = line.kind || "other";
      const list = map.get(key) || [];
      list.push(line);
      map.set(key, list);
    }

    return [
      ...KIND_ORDER.filter((k) => map.has(k)),
      ...[...map.keys()].filter(
        (k) => !KIND_ORDER.includes(k as (typeof KIND_ORDER)[number]),
      ),
    ].map((kind) => {
        const lines = map.get(kind) || [];
        const subtotal = lines.reduce((s, l) => s + (Number(l.amountETB) || 0), 0);
        return { kind, lines, subtotal };
      });
  }, [bill]);

  const lineCount = bill?.lines?.length || 0;
  const status = bill?.status || "open";

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
        title="My bill"
        description="Charges for this stay — settled at checkout."
        icon={<Receipt className="size-5" />}
        action={
          <Badge
            variant="outline"
            className={cn(
              "capitalize px-2.5 py-1 text-xs font-medium",
              statusTone(status),
            )}
          >
            {status}
          </Badge>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/15 via-card to-card p-5 shadow-md ring-1 ring-black/5 dark:ring-white/10 md:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-500/70 via-primary/50 to-emerald-500/40" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Running total
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground md:text-4xl">
              {formatEtb(bill?.totalETB || 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              {lineCount === 0
                ? "No charges posted yet"
                : `${lineCount} charge${lineCount === 1 ? "" : "s"} on this stay`}
            </p>
          </div>

          {grouped.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {grouped.map(({ kind, subtotal }) => {
                const meta = KIND_META[kind] || KIND_META.other;
                return (
                  <Badge
                    key={kind}
                    variant="secondary"
                    className="gap-1.5 font-normal tabular-nums"
                  >
                    <span className="text-muted-foreground">{meta.label}</span>
                    <span className="font-medium text-foreground">
                      {formatEtb(subtotal)}
                    </span>
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {lineCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground/70">
            <Receipt className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">No charges yet</p>
          <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
            Room nights and in-room orders will show up here as they are added
            to your stay.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ kind, lines, subtotal }) => {
            const meta = KIND_META[kind] || KIND_META.other;
            const Icon = meta.icon;
            return (
              <section
                key={kind}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-card/95 shadow-md ring-1 ring-black/5 dark:ring-white/10",
                  meta.accent,
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 border-b border-border/60 bg-linear-to-r to-transparent px-4 py-3",
                    meta.headerTone,
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        meta.iconTone,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold tracking-tight text-foreground">
                        {meta.label}
                      </h2>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {lines.length} line{lines.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatEtb(subtotal)}
                  </p>
                </div>

                <ul className="divide-y divide-border/60">
                  {lines.map((line) => {
                    const when = formatLineWhen(line.createdAt);
                    return (
                      <li
                        key={line.id}
                        className="flex flex-col gap-2 px-3 py-3.5 transition-colors hover:bg-muted/25 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4"
                      >
                  <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium leading-snug text-foreground">
                              {cleanDescription(line.description)}
                            </p>
                            {line.kind === "food_drink" ||
                            line.kind === "laundry" ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "h-5 px-1.5 text-[10px] capitalize",
                                  String(line.fulfillmentStatus || "pending").toLowerCase() ===
                                    "completed"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                    : String(line.fulfillmentStatus || "pending").toLowerCase() ===
                                        "cancelled"
                                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
                                )}
                              >
                                {String(line.fulfillmentStatus || "pending")}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {line.quantity} × {formatEtb(line.unitPriceETB)}
                            {line.roomNumber ? ` · Room ${line.roomNumber}` : ""}
                            {when ? ` · ${when}` : ""}
                          </p>
                        </div>
                        <p className="shrink-0 self-end text-sm font-semibold tabular-nums text-foreground sm:self-auto sm:pt-0.5">
                          {formatEtb(line.amountETB)}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Section total</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatEtb(subtotal)}
                    </span>
                  </div>
                </div>
              </section>
            );
          })}

          <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Stay total
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Payable at checkout
                </p>
              </div>
              <p className="text-xl font-semibold tabular-nums text-primary">
                {formatEtb(bill?.totalETB || 0)}
              </p>
            </div>
            <Separator className="my-3 opacity-60" />
            <p className="text-xs text-pretty text-muted-foreground">
              Questions about a charge? Use Call hotel from the header — reception
              can review your bill with you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

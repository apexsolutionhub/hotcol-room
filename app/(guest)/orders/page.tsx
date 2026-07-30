"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { PageHero } from "@/components/guest/page-hero";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    href: "/food/update",
    title: "Food & drink update",
    body: "Review status, update quantity, or cancel pending food and drink orders.",
    tone: "from-emerald-500/15 via-card to-card border-emerald-500/30",
    iconTone: "bg-emerald-500/15 text-emerald-400",
  },
  {
    href: "/laundry/update",
    title: "Laundry update",
    body: "Review status, update quantity, or cancel pending laundry orders.",
    tone: "from-sky-500/15 via-card to-card border-sky-500/30",
    iconTone: "bg-sky-500/15 text-sky-400",
  },
] as const;

export default function OrdersPage() {
  return (
    <div className="space-y-5">
      <PageHero
        title="Order updates"
        description="Choose a service to update or review the status of its orders."
        icon={<ClipboardList className="size-5" />}
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className={cn(
                "group relative flex h-full items-start gap-3 overflow-hidden rounded-2xl border bg-linear-to-br p-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg",
                section.tone,
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                  section.iconTone,
                )}
              >
                <ClipboardList className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {section.title}
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-sm text-pretty text-muted-foreground">
                  {section.body}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

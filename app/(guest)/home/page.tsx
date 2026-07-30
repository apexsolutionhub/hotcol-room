"use client";

import Link from "next/link";
import {
  Receipt,
  Shirt,
  UtensilsCrossed,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { useGuestSession } from "@/hooks/use-guest-session";
import { PageHero } from "@/components/guest/page-hero";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    href: "/food",
    title: "Food & drink",
    body: "Order from this hotel’s café menu. Kitchen prepares for your room.",
    icon: UtensilsCrossed,
    tone: "from-emerald-500/15 via-card to-card border-emerald-500/30",
    iconTone: "bg-emerald-500/15 text-emerald-400",
  },
  {
    href: "/laundry",
    title: "Laundry",
    body: "Send items using the hotel’s laundry price list.",
    icon: Shirt,
    tone: "from-sky-500/15 via-card to-card border-sky-500/30",
    iconTone: "bg-sky-500/15 text-sky-400",
  },
  {
    href: "/orders",
    title: "Order updates",
    body: "Update or cancel pending food, drink, and laundry orders.",
    icon: ClipboardList,
    tone: "from-amber-500/15 via-card to-card border-amber-500/30",
    iconTone: "bg-amber-500/15 text-amber-400",
  },
] as const;

export default function HomePage() {
  const { stay } = useGuestSession({ requireAuth: true });
  const property =
    stay?.property?.displayName || stay?.HotelName || "your hotel";
  const rooms = stay?.rooms.map((r) => r.roomNumber).filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <PageHero
        title={property}
        description={
          `Welcome${stay?.guest.firstName ? `, ${stay.guest.firstName}` : ""}.` +
          (rooms
            ? ` Room ${rooms} is ready for in-room service.`
            : " Your stay is connected.") +
          " Use the phone icon next to Logout to call the hotel."
        }
        icon={<span className="text-sm font-bold">HC</span>}
      />

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Services
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            What would you like?
          </h2>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={cn(
                    "group relative flex h-full items-start gap-3 overflow-hidden rounded-2xl border bg-linear-to-br p-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg",
                    action.tone,
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                      action.iconTone,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {action.title}
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-sm text-pretty text-muted-foreground">
                      {action.body}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

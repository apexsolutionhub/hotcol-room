"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Shirt,
  UtensilsCrossed,
  Receipt,
  LogOut,
  Home,
  Phone,
  Menu,
  MessageSquareWarning,
  Star,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StoredGuestStay } from "@/lib/guestSession";
import { hotelCallOptions } from "@/lib/phoneTel";
import { useMemo, useState } from "react";
import { RefreshIconButton } from "@/components/ui/refresh-icon-button";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/bill", label: "My bill", icon: Receipt },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/rate", label: "Rate stay", icon: Star },
  { href: "/registration", label: "Registration card", icon: IdCard },
] as const;

const SERVICE_NAV = [
  {
    label: "Food & drink",
    icon: UtensilsCrossed,
    root: "/food",
    items: [
      { href: "/food", label: "Order" },
      { href: "/food/update", label: "Order update" },
    ],
  },
  {
    label: "Laundry",
    icon: Shirt,
    root: "/laundry",
    items: [
      { href: "/laundry", label: "Order" },
      { href: "/laundry/update", label: "Order update" },
    ],
  },
] as const;

type Props = {
  stay: StoredGuestStay;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  children: React.ReactNode;
};

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const activeServiceRoot = SERVICE_NAV.find((section) =>
    pathname === section.root || pathname.startsWith(`${section.root}/`),
  )?.root;

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      {SERVICE_NAV.map((section) => {
        const Icon = section.icon;
        const active = activeServiceRoot === section.root;

        return (
          <Collapsible
            key={section.root}
            defaultOpen={active}
            className="group/collapsible"
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{section.label}</span>
                <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1 pl-3">
              {section.items.map((item) => {
                const subActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-all",
                      subActive
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}

export function GuestShell({
  stay,
  onLogout,
  onRefresh,
  refreshing = false,
  children,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const rooms = stay.rooms.map((r) => r.roomNumber).filter(Boolean).join(", ");
  const propertyName = stay.property?.displayName || stay.HotelName;
  const guestName = `${stay.guest.firstName} ${stay.guest.lastName}`.trim();
  const callOptions = useMemo(
    () => hotelCallOptions(stay.property),
    [stay.property],
  );

  function onCallClick() {
    if (callOptions.length === 0) {
      toast.error("Hotel phone is not set yet. Ask reception or the manager.");
      return;
    }
    if (callOptions.length === 1) {
      window.location.href = callOptions[0].href;
      return;
    }
    setPickOpen(true);
  }

  return (
    <div className="flex min-h-dvh w-full bg-muted/40 text-foreground print:bg-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-1 overflow-hidden border-0 bg-linear-to-br from-background via-background to-muted/20 lg:my-2 lg:max-h-[calc(100dvh-1rem)] lg:min-h-[calc(100dvh-1rem)] lg:rounded-xl lg:border lg:border-border/80 lg:bg-background lg:shadow-lg lg:ring-1 lg:ring-black/5 dark:lg:ring-white/10 print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none print:ring-0">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border/80 bg-sidebar/40 print:hidden lg:flex">
          <div className="flex items-center gap-2.5 border-b border-border/70 px-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/20">
              <span className="text-xs font-bold tracking-tight">HC</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                HotCol Room
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Guest portal
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <NavLinks pathname={pathname} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col print:block">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-2.5 backdrop-blur supports-backdrop-filter:bg-background/80 print:hidden sm:gap-3 sm:px-3 md:h-16 md:px-5">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(18rem,88vw)] p-0">
                  <SheetHeader className="border-b border-border/70 px-4 py-4 text-left">
                    <SheetTitle className="text-base">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="p-3">
                    <NavLinks
                      pathname={pathname}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                  {propertyName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground md:text-xs">
                  {guestName || "Guest"}
                  {rooms ? (
                    <span className="hidden min-[380px]:inline">{` · Room ${rooms}`}</span>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <RefreshIconButton
                busy={refreshing}
                onClick={onRefresh}
                aria-label="Refresh"
                className="text-muted-foreground hover:text-foreground"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onCallClick}
                className={cn(
                  "text-primary hover:bg-primary/10 hover:text-primary",
                  callOptions.length === 0 && "text-muted-foreground",
                )}
                aria-label="Call hotel"
                title={
                  callOptions.length
                    ? "Call hotel"
                    : "Hotel phone not set"
                }
              >
                <Phone className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="px-2 text-muted-foreground hover:text-foreground sm:px-3"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>

          <main className="guest-animate-in flex-1 overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] print:overflow-visible print:p-0 sm:px-4 sm:py-5 md:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>

      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="overflow-hidden border-primary/20 bg-card/95 print:hidden sm:max-w-sm shadow-xl ring-1 ring-black/5 dark:ring-white/10">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/60 via-sky-500/45 to-emerald-500/40" />
          <DialogHeader>
            <DialogTitle>Call hotel</DialogTitle>
            <DialogDescription>
              Choose which line to dial.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            {callOptions.map((opt) => (
              <Button
                key={opt.key}
                variant="outline"
                className="h-auto justify-start gap-3 px-4 py-3"
                onClick={() => {
                  setPickOpen(false);
                  window.location.href = opt.href;
                }}
              >
                <Phone className="size-4 text-primary" />
                <span className="flex min-w-0 flex-col items-start text-left">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {opt.phone}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

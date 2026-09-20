"use client";

import { useEffect, useState } from "react";
import { IdCard, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  fetchGuestRegistrationCard,
  type GuestStay,
} from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { PageHero } from "@/components/guest/page-hero";
import { GuestRegistrationCard } from "@/components/guest/registration-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function RegistrationPage() {
  const [stay, setStay] = useState<GuestStay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGuestRegistrationCard();
        if (!cancelled) setStay(data);
      } catch (e) {
        toast.error(notifyError(e, "Could not load registration card"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!stay) {
    return (
      <Empty className="border border-dashed border-border/80 bg-card/60 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IdCard />
          </EmptyMedia>
          <EmptyTitle>Registration card unavailable</EmptyTitle>
          <EmptyDescription>
            We could not load your stay details. Refresh and try again, or ask
            reception.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-5">
      <PageHero
        className="print:hidden"
        title="Registration card"
        description="Print a branded copy of your guest registration for this stay."
        icon={<IdCard className="size-5" />}
        action={
          <Button
            type="button"
            onClick={() => window.print()}
            className="gap-2 shadow-sm"
          >
            <Printer className="size-4" />
            Print
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm ring-1 ring-black/5 print:border-0 print:bg-transparent print:shadow-none print:ring-0 dark:ring-white/10">
        <GuestRegistrationCard stay={stay} />
      </div>
    </div>
  );
}

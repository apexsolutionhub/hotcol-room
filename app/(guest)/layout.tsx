"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGuestSession } from "@/hooks/use-guest-session";
import { GuestShell } from "@/components/guest/guest-shell";
import { Spinner } from "@/components/ui/spinner";
import { notifyError } from "@/lib/api/client";

export default function GuestGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { stay, loading, logout, refreshStay } = useGuestSession({
    requireAuth: true,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshStay();
      setRefreshKey((k) => k + 1);
      toast.success("Refreshed");
    } catch (e) {
      toast.error(notifyError(e, "Could not refresh"));
    } finally {
      setRefreshing(false);
    }
  }

  if (loading || !stay) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-linear-to-b from-background via-muted/20 to-muted/40">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <GuestShell
      stay={stay}
      onLogout={logout}
      onRefresh={() => void onRefresh()}
      refreshing={refreshing}
    >
      <div key={refreshKey}>{children}</div>
    </GuestShell>
  );
}

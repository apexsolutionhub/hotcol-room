"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearGuestSession,
  isGuestLoggedIn,
  readGuestToken,
  readStoredStay,
  type StoredGuestStay,
  writeGuestSession,
} from "@/lib/guestSession";
import { fetchGuestMe, type GuestStay } from "@/lib/api/guest";

function toStored(stay: GuestStay): StoredGuestStay {
  return {
    id: stay.id,
    voucherCode: stay.voucherCode,
    status: stay.status,
    HotelName: stay.HotelName,
    guest: stay.guest,
    rooms: stay.rooms,
    property: stay.property,
  };
}

export function useGuestSession(options?: { requireAuth?: boolean }) {
  const requireAuth = options?.requireAuth ?? true;
  const router = useRouter();
  const [stay, setStay] = useState<StoredGuestStay | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStay = useCallback(async () => {
    if (!isGuestLoggedIn()) {
      clearGuestSession();
      setStay(null);
      if (requireAuth) router.replace("/");
      throw new Error("Session expired");
    }

    const me = await fetchGuestMe();
    const token = readGuestToken();
    if (token) writeGuestSession(token, toStored(me));
    setStay(toStored(me));
    return toStored(me);
  }, [requireAuth, router]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!isGuestLoggedIn()) {
        if (requireAuth) router.replace("/");
        if (!cancelled) {
          setStay(null);
          setLoading(false);
        }
        return;
      }

      const cached = readStoredStay();
      if (cached && !cancelled) setStay(cached);

      try {
        await refreshStay();
        if (cancelled) return;
      } catch {
        clearGuestSession();
        if (requireAuth) router.replace("/");
        if (!cancelled) setStay(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [requireAuth, router, refreshStay]);

  function logout() {
    clearGuestSession();
    setStay(null);
    router.replace("/");
  }

  return { stay, loading, logout, setStay, refreshStay };
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GuestOrderCatalog,
  type GuestCatalogItem,
} from "@/components/guest/guest-order-catalog";
import type { GuestOrderLine } from "@/components/guest/guest-order-modals";
import { fetchGuestLaundryCatalog, guestPlaceOrder } from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export default function LaundryPage() {
  const [items, setItems] = useState<GuestCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await fetchGuestLaundryCatalog();
        if (cancelled) return;
        // Same mapping as ReceptionRoomOrderSection.laundryItemsAsMenuItems
        setItems(
          catalog.map((i) => ({
            id: i.id,
            name: i.name,
            price: Number(i.unitPriceETB) || 0,
            category: "others",
            type: i.unitLabel || "laundry",
            imageUrl: i.imageUrl || "",
            isSuspended: false,
          })),
        );
      } catch (e) {
        toast.error(notifyError(e, "Could not load laundry list"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function placeOrder(otp: string, lines: GuestOrderLine[]) {
    try {
      await guestPlaceOrder({
        otp,
        laundry: lines.map((l) => ({
          serviceItemId: l.itemId,
          quantity: l.quantity,
        })),
      });
    } catch (e) {
      throw new Error(notifyError(e, "Could not place laundry order"));
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
    <GuestOrderCatalog
      mode="laundry"
      items={items}
      onPlaceOrder={placeOrder}
    />
  );
}

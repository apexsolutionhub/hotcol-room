"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GuestOrderCatalog,
  type GuestCatalogItem,
} from "@/components/guest/guest-order-catalog";
import type { GuestOrderLine } from "@/components/guest/guest-order-modals";
import { fetchGuestCafeMenu, guestPlaceOrder } from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export default function FoodPage() {
  const [items, setItems] = useState<GuestCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const menu = await fetchGuestCafeMenu();
        if (cancelled) return;
        setItems(
          menu.map((i) => ({
            id: i.id,
            name: i.name,
            price: Number(i.price) || 0,
            category: i.category || "others",
            type: i.type || "",
            imageUrl: i.imageUrl || "",
            isSuspended: i.isSuspended,
          })),
        );
      } catch (e) {
        toast.error(notifyError(e, "Could not load menu"));
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
        foodDrink: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
        })),
      });
    } catch (e) {
      throw new Error(notifyError(e, "Could not place order"));
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
      mode="food_drink"
      items={items}
      onPlaceOrder={placeOrder}
    />
  );
}

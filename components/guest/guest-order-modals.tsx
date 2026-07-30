"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  UtensilsCrossed,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OtpConfirmDialog } from "@/components/guest/otp-confirm-dialog";

export type GuestOrderLine = {
  itemId: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type ReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: GuestOrderLine[];
  onChangeLines: (lines: GuestOrderLine[]) => void;
  onApprove: () => void;
  mode: "food_drink" | "laundry";
};

export function GuestBatchReviewModal({
  open,
  onOpenChange,
  lines,
  onChangeLines,
  onApprove,
  mode,
}: ReviewModalProps) {
  const isLaundry = mode === "laundry";
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  const ModeIcon = isLaundry ? Shirt : UtensilsCrossed;

  function setQty(itemId: number, next: number) {
    if (next < 1) {
      remove(itemId);
      return;
    }
    onChangeLines(
      lines.map((l) =>
        l.itemId === itemId ? { ...l, quantity: next } : l,
      ),
    );
  }

  function remove(itemId: number) {
    onChangeLines(lines.filter((l) => l.itemId !== itemId));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-primary/20 bg-card/95 p-0 shadow-xl ring-1 ring-black/5 sm:max-w-lg dark:ring-white/10">
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-linear-to-r from-primary/60 via-sky-500/45 to-emerald-500/40" />

        <DialogHeader className="gap-2 border-b border-border/60 px-6 pt-6 pr-12 pb-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <ModeIcon className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg">
                {isLaundry ? "Review laundry order" : "Review food & drink order"}
              </DialogTitle>
              <DialogDescription>
                {isLaundry
                  ? "Adjust quantities, then approve to charge your room."
                  : "Check your selection, then approve to send it to the kitchen or bar."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
              <ShoppingBag className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No items left</p>
              <p className="text-xs text-muted-foreground">
                Close this dialog and select items again.
              </p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.itemId}
                className="group flex gap-3 rounded-xl border border-border/70 bg-muted/15 p-3 transition-colors hover:border-primary/25 hover:bg-muted/30"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60">
                  <Image
                    src={
                      line.imageUrl ||
                      "https://placehold.co/96x96/png?text=Item"
                    }
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug">
                        {line.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {line.price.toFixed(2)} ETB each
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(line.itemId)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setQty(line.itemId, line.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setQty(line.itemId, line.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {(line.price * line.quantity).toFixed(2)}{" "}
                      <span className="text-xs font-medium text-muted-foreground">
                        ETB
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 border-t border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Order total
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal tabular-nums">
                  {lines.length} item{lines.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline" className="font-normal tabular-nums">
                  {units} unit{units === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-primary">
              {total.toFixed(2)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                ETB
              </span>
            </p>
          </div>

          <Separator className="opacity-60" />

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="sm:flex-1"
              disabled={lines.length === 0}
              onClick={onApprove}
            >
              {isLaundry
                ? `Approve laundry · ${units}`
                : `Approve order · ${units}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SingleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    type: string;
  } | null;
  onApprove: (quantity: number) => void;
};

export function GuestSingleOrderModal({
  open,
  onOpenChange,
  item,
  onApprove,
}: SingleModalProps) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) setQty(1);
  }, [open, item?.id]);

  if (!item) return null;
  const total = item.price * qty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden border-border/80 bg-card/95">
        <DialogHeader>
          <DialogTitle>Customize Order</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={item.imageUrl || "https://placehold.co/128x128/png?text=Item"}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
            <p className="text-sm font-semibold text-primary">
              {item.price.toFixed(2)} ETB
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-lg font-bold tabular-nums text-primary">
            {total.toFixed(2)} ETB
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onApprove(qty)}
          >
            Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PendingOrder =
  | { kind: "batch"; lines: GuestOrderLine[] }
  | { kind: "single"; line: GuestOrderLine };

type ApproveBridgeProps = {
  pending: PendingOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirming: boolean;
  onConfirmOtp: (otp: string) => Promise<void>;
};

export function GuestOrderOtpBridge({
  pending,
  open,
  onOpenChange,
  confirming,
  onConfirmOtp,
}: ApproveBridgeProps) {
  const count = useMemo(() => {
    if (!pending) return 0;
    if (pending.kind === "single") return pending.line.quantity;
    return pending.lines.reduce((s, l) => s + l.quantity, 0);
  }, [pending]);

  return (
    <OtpConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      confirming={confirming}
      title="Approve with room code"
      description={`Enter your 6-digit room code to send ${count} item${count === 1 ? "" : "s"} to the hotel.`}
      onConfirm={onConfirmOtp}
    />
  );
}

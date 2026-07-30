"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CartLine = {
  key: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  meta?: string;
};

type CatalogCardProps = {
  title: string;
  priceLabel: string;
  imageUrl?: string;
  subtitle?: string;
  quantity: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
};

export function CatalogCard({
  title,
  priceLabel,
  imageUrl,
  subtitle,
  quantity,
  onAdd,
  onInc,
  onDec,
}: CatalogCardProps) {
  return (
    <article className="flex gap-3 border-b border-border/70 py-4 last:border-b-0">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/5 dark:ring-white/10">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-foreground">{title}</h3>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {priceLabel}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {quantity <= 0 ? (
            <Button size="sm" onClick={onAdd}>
              Add
            </Button>
          ) : (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/60 p-0.5 ring-1 ring-black/5 dark:ring-white/10",
              )}
            >
              <Button size="icon-xs" variant="ghost" onClick={onDec}>
                <Minus />
              </Button>
              <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
              <Button size="icon-xs" variant="ghost" onClick={onInc}>
                <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

type CartBarProps = {
  lines: CartLine[];
  onCheckout: () => void;
  disabled?: boolean;
};

export function CartBar({ lines, onCheckout, disabled }: CartBarProps) {
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {count} item{count === 1 ? "" : "s"}
          </p>
          <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
            {total.toLocaleString()} ETB
          </p>
        </div>
        <Button size="lg" onClick={onCheckout} disabled={disabled}>
          Approve order
        </Button>
      </div>
    </div>
  );
}

export function formatEtb(n: number) {
  return `${Number(n || 0).toLocaleString()} ETB`;
}

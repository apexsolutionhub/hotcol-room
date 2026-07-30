"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Utensils,
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  Search,
  LayoutGrid,
  Ellipsis,
} from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  GuestBatchReviewModal,
  GuestOrderOtpBridge,
  GuestSingleOrderModal,
  type GuestOrderLine,
} from "@/components/guest/guest-order-modals";

export type GuestCatalogItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  type: string;
  imageUrl: string;
  isSuspended?: boolean;
};

type MenuCategory = "all" | "food" | "beverage" | "others";

const PLACEHOLDER = "https://placehold.co/400x400/png?text=Menu";

type Props = {
  items: GuestCatalogItem[];
  mode: "food_drink" | "laundry";
  /** Place order after OTP — food uses itemId, laundry uses serviceItemId (= id). */
  onPlaceOrder: (otp: string, lines: GuestOrderLine[]) => Promise<void>;
};

export function GuestOrderCatalog({ items, mode, onPlaceOrder }: Props) {
  const hideTypeFilters = mode === "laundry";
  const [searchedText, setSearchedText] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [menuCategory, setMenuCategory] = useState<MenuCategory>("all");
  const [selectedItems, setSelectedItems] = useState<GuestCatalogItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>(
    {},
  );
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [singleItem, setSingleItem] = useState<GuestCatalogItem | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingLines, setPendingLines] = useState<GuestOrderLine[] | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const uniqueTypes = useMemo(
    () => [...new Set(items.map((item) => item.type).filter(Boolean))],
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = searchedText.trim().toLowerCase();
    return items.filter((item) => {
      const cat = String(item.category || "").toLowerCase();
      const categoryOk =
        hideTypeFilters ||
        menuCategory === "all" ||
        (menuCategory === "food" && cat === "food") ||
        (menuCategory === "beverage" && cat === "beverage") ||
        (menuCategory === "others" && cat === "others");
      const typeOk =
        hideTypeFilters || selectedType === "All" || item.type === selectedType;
      const searchOk = !q || item.name.toLowerCase().includes(q);
      return categoryOk && typeOk && searchOk;
    });
  }, [items, menuCategory, selectedType, searchedText, hideTypeFilters]);

  const categoryCounts = useMemo(() => {
    const counts = { all: items.length, food: 0, beverage: 0, others: 0 };
    for (const item of items) {
      const cat = String(item.category || "").toLowerCase();
      if (cat === "food") counts.food += 1;
      else if (cat === "beverage") counts.beverage += 1;
      else if (cat === "others") counts.others += 1;
    }
    return counts;
  }, [items]);

  const handleItemCheck = (item: GuestCatalogItem, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [...prev, item];
      });
      setItemQuantities((prevQ) =>
        prevQ[item.id] ? prevQ : { ...prevQ, [item.id]: 1 },
      );
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
      setItemQuantities((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  const updateItemQuantity = (itemId: number, amount: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 1;
      return { ...prev, [itemId]: Math.max(1, current + amount) };
    });
  };

  const totalSelectedQuantity = selectedItems.reduce(
    (sum, item) => sum + (itemQuantities[item.id] || 1),
    0,
  );

  const totalSelectedAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * (itemQuantities[item.id] || 1),
    0,
  );

  const batchLines: GuestOrderLine[] = useMemo(
    () =>
      selectedItems.map((item) => ({
        itemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl || PLACEHOLDER,
        quantity: itemQuantities[item.id] || 1,
      })),
    [selectedItems, itemQuantities],
  );

  function openApprove(lines: GuestOrderLine[]) {
    if (lines.length === 0) {
      toast.error("No items selected");
      return;
    }
    setPendingLines(lines);
    setShowBatchModal(false);
    setSingleItem(null);
    setOtpOpen(true);
  }

  async function confirmOtp(otp: string) {
    if (!pendingLines?.length) return;
    setSubmitting(true);
    try {
      await onPlaceOrder(otp, pendingLines);
      setSelectedItems([]);
      setItemQuantities({});
      setPendingLines(null);
      toast.success(
        mode === "laundry"
          ? "Laundry order sent"
          : "Order sent to kitchen / bar",
      );
    } catch (e) {
      throw e instanceof Error ? e : new Error("Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-col bg-linear-to-b from-background to-muted/20">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto max-w-[1600px] space-y-4 px-0 py-4 md:px-0 md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                {hideTypeFilters ? "Laundry" : "Menu"}
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Tap a card for a quick order, or select items for a batch order
                — approve with your room code.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedItems.length > 0 ? (
                <Button
                  onClick={() => setShowBatchModal(true)}
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Order {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="relative w-full max-w-sm sm:w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  hideTypeFilters ? "Search laundry…" : "Search menu…"
                }
                className="h-10 pl-9"
                value={searchedText}
                onChange={(e) => setSearchedText(e.target.value)}
              />
            </div>
            {!hideTypeFilters ? (
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Item type</SelectLabel>
                    <SelectItem value="All">All types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {!hideTypeFilters ? (
            <Tabs
              value={menuCategory}
              onValueChange={(v) => setMenuCategory(v as MenuCategory)}
              className="w-full"
            >
              <TabsList className="flex h-auto w-full items-stretch gap-1 overflow-x-auto bg-muted/50 p-1 group-data-horizontal/tabs:h-auto sm:grid sm:grid-cols-4 sm:overflow-visible">
                <TabsTrigger
                  value="all"
                  className="h-auto min-w-0 flex-1 flex-col gap-0.5 px-1.5 py-2 text-[11px] leading-tight whitespace-normal sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm sm:whitespace-nowrap"
                >
                  <LayoutGrid className="size-3.5 shrink-0" />
                  <span>All</span>
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] sm:ml-1"
                  >
                    {categoryCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="food"
                  className="h-auto min-w-0 flex-1 flex-col gap-0.5 px-1.5 py-2 text-[11px] leading-tight whitespace-normal sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm sm:whitespace-nowrap"
                >
                  <Utensils className="size-3.5 shrink-0" />
                  <span>Kitchen</span>
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] sm:ml-1"
                  >
                    {categoryCounts.food}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="beverage"
                  className="h-auto min-w-0 flex-1 flex-col gap-0.5 px-1.5 py-2 text-[11px] leading-tight whitespace-normal sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm sm:whitespace-nowrap"
                >
                  <Coffee className="size-3.5 shrink-0" />
                  <span>Bar</span>
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] sm:ml-1"
                  >
                    {categoryCounts.beverage}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="others"
                  className="h-auto min-w-0 flex-1 flex-col gap-0.5 px-1.5 py-2 text-[11px] leading-tight whitespace-normal sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm sm:whitespace-nowrap"
                >
                  <Ellipsis className="size-3.5 shrink-0" />
                  <span>Others</span>
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] sm:ml-1"
                  >
                    {categoryCounts.others}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "mx-auto w-full max-w-[1600px] flex-1 px-0 py-5 md:px-0 md:py-6",
          selectedItems.length > 0 && "pb-28",
        )}
      >
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16 text-center sm:py-20">
            <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">No items match</h3>
            <p className="mt-1 max-w-sm px-4 text-sm text-muted-foreground">
              {items.length === 0
                ? hideTypeFilters
                  ? "No laundry services are listed for this hotel yet."
                  : "No menu items available."
                : "Try another category or clear your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.some((i) => i.id === item.id);
              const quantity = itemQuantities[item.id] || 1;
              const totalPrice = item.price * quantity;
              const suspended = !!item.isSuspended;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "group flex flex-col overflow-hidden border-border/70 shadow-sm transition-all hover:border-primary/40 hover:shadow-md",
                    isSelected && "border-primary ring-2 ring-primary/15",
                    suspended &&
                      "border-dashed opacity-90 hover:border-border/70 hover:shadow-sm",
                  )}
                  aria-disabled={suspended}
                >
                  <button
                    type="button"
                    disabled={suspended}
                    className={cn(
                      "relative aspect-4/3 w-full overflow-hidden bg-muted min-[420px]:aspect-square",
                      suspended && "cursor-not-allowed",
                    )}
                    onClick={() => {
                      if (!suspended) setSingleItem(item);
                    }}
                  >
                    <Image
                      src={item.imageUrl || PLACEHOLDER}
                      alt={item.name}
                      fill
                      sizes="(max-width: 420px) 100vw, (max-width: 640px) 50vw, 200px"
                      className={cn(
                        "object-cover transition-transform duration-300 group-hover:scale-105",
                        suspended && "grayscale",
                      )}
                      unoptimized
                    />
                    {suspended ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-2">
                        <Badge
                          variant="secondary"
                          className="-rotate-6 bg-background/90 text-[10px] font-semibold tracking-wide text-foreground uppercase shadow-md sm:text-[11px]"
                        >
                          Temporarily Unavailable
                        </Badge>
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 pt-8 pb-2 sm:px-3">
                      <p className="line-clamp-2 text-left text-sm leading-snug font-semibold text-white sm:text-base">
                        {item.name}
                      </p>
                    </div>
                  </button>

                  <CardFooter className="flex flex-col gap-2.5 p-3 sm:p-3.5">
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-base font-bold tabular-nums text-primary">
                        {item.price.toFixed(2)}{" "}
                        <span className="text-[10px] font-medium text-muted-foreground">
                          ETB
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className="max-w-[45%] truncate text-[10px] capitalize"
                      >
                        {item.type}
                      </Badge>
                    </div>

                    {suspended ? (
                      <p className="w-full rounded-lg bg-muted/60 px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
                        Temporarily unavailable — cannot be ordered
                      </p>
                    ) : null}

                    {isSelected && !suspended ? (
                      <div className="flex w-full items-center justify-between rounded-lg bg-primary/5 px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateItemQuantity(item.id, -1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">
                            {quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateItemQuantity(item.id, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <span className="text-xs font-semibold tabular-nums">
                          {totalPrice.toFixed(2)} ETB
                        </span>
                      </div>
                    ) : null}

                    <div className="flex w-full items-center justify-between gap-2">
                      <label
                        className={cn(
                          "flex items-center gap-2 text-xs text-muted-foreground",
                          suspended
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={suspended}
                          onCheckedChange={(checked) =>
                            handleItemCheck(item, checked === true)
                          }
                        />
                        Batch
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 min-w-18 text-xs"
                        disabled={suspended}
                        onClick={() => setSingleItem(item)}
                      >
                        {suspended ? "Unavailable" : "Order"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedItems.length > 0 ? (
        <div className="sticky bottom-0 z-20 border-t bg-background/95 px-3 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 md:px-0">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selectedItems.length} selected · {totalSelectedQuantity}{" "}
                  units
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready for batch order
                </p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <p className="text-lg font-bold tabular-nums text-primary">
                {totalSelectedAmount.toFixed(2)} ETB
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowBatchModal(true)}
              >
                Order now
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <GuestBatchReviewModal
        open={showBatchModal}
        onOpenChange={setShowBatchModal}
        lines={batchLines}
        mode={mode}
        onChangeLines={(lines) => {
          setSelectedItems(
            lines
              .map((l) => items.find((i) => i.id === l.itemId))
              .filter(Boolean) as GuestCatalogItem[],
          );
          const nextQty: Record<number, number> = {};
          for (const l of lines) nextQty[l.itemId] = l.quantity;
          setItemQuantities(nextQty);
        }}
        onApprove={() => openApprove(batchLines)}
      />

      <GuestSingleOrderModal
        open={singleItem != null}
        onOpenChange={(open) => {
          if (!open) setSingleItem(null);
        }}
        item={
          singleItem
            ? {
                id: singleItem.id,
                name: singleItem.name,
                price: singleItem.price,
                imageUrl: singleItem.imageUrl || PLACEHOLDER,
                type: singleItem.type,
              }
            : null
        }
        onApprove={(quantity) => {
          if (!singleItem) return;
          openApprove([
            {
              itemId: singleItem.id,
              name: singleItem.name,
              price: singleItem.price,
              imageUrl: singleItem.imageUrl || PLACEHOLDER,
              quantity,
            },
          ]);
        }}
      />

      <GuestOrderOtpBridge
        pending={
          pendingLines
            ? { kind: "batch", lines: pendingLines }
            : null
        }
        open={otpOpen}
        onOpenChange={(open) => {
          setOtpOpen(open);
          if (!open) setPendingLines(null);
        }}
        confirming={submitting}
        onConfirmOtp={confirmOtp}
      />
    </div>
  );
}

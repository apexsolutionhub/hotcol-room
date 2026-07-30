"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Minus,
  MousePointerClick,
  Plus,
  UtensilsCrossed,
  Shirt,
  Trash2,
  Clock,
} from "lucide-react";
import {
  fetchGuestCafeMenu,
  fetchGuestBill,
  fetchGuestLaundryCatalog,
  guestCancelOrderLine,
  guestPlaceOrder,
  guestUpdateOrderLine,
  type GuestBill,
  type GuestBillLine,
} from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import { formatEtb } from "@/components/guest/catalog";
import { PageHero } from "@/components/guest/page-hero";
import { OtpConfirmDialog } from "@/components/guest/otp-confirm-dialog";
import {
  GuestBatchReviewModal,
  type GuestOrderLine,
} from "@/components/guest/guest-order-modals";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Mode = "food_drink" | "laundry";
type CatalogItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  type: string;
  imageUrl: string;
};

type PendingAction =
  | { type: "update"; line: GuestBillLine; quantity: number }
  | { type: "cancel"; line: GuestBillLine }
  | { type: "add"; lines: GuestOrderLine[] };

function cleanDescription(description: string) {
  return description.replace(/\s*·\s*#co:\d+\s*$/i, "").trim();
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") {
    return "bg-green-100 text-green-800 hover:bg-green-100";
  }
  if (s === "cancelled") {
    return "bg-destructive/10 text-destructive hover:bg-destructive/10";
  }
  return "bg-amber-100 text-amber-900 hover:bg-amber-100";
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status.toLowerCase() === "completed";
  const isCancelled = status.toLowerCase() === "cancelled";
  return (
    <Badge className={cn("h-5 gap-1 px-1.5 text-[10px]", statusTone(status))}>
      {isCompleted ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : isCancelled ? null : (
        <Clock className="h-3 w-3" />
      )}
      {status}
    </Badge>
  );
}

function formatOrderTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function modeMeta(mode: Mode) {
  if (mode === "laundry") {
    return {
      title: "Laundry · Order update",
      description:
        "Update or cancel your pending laundry lines with your room code. Reception marks completion.",
      icon: Shirt,
      empty: "No laundry orders yet",
      emptyBody: "Laundry orders you place will appear here for updates and status.",
      kindLabel: "Laundry",
      iconTone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      accent: "text-sky-600 dark:text-sky-400",
    };
  }
  return {
    title: "Food & drink · Order update",
    description:
      "Update or cancel your pending food and drink orders with your room code before the hotel completes them.",
    icon: UtensilsCrossed,
    empty: "No food or drink orders yet",
    emptyBody: "Food and drink orders you place will appear here for updates and status.",
    kindLabel: "Food & drink",
    iconTone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
  };
}

export function GuestOrderUpdatePage({ mode }: { mode: Mode }) {
  const [bill, setBill] = useState<GuestBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftQty, setDraftQty] = useState<Record<number, number>>({});
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sideTab, setSideTab] = useState<"edit" | "add">("edit");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedAddItems, setSelectedAddItems] = useState<CatalogItem[]>([]);
  const [addQuantities, setAddQuantities] = useState<Record<number, number>>({});
  const [batchOpen, setBatchOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const meta = modeMeta(mode);
  const Icon = meta.icon;

  function selectLine(lineId: number) {
    setSelectedId(lineId);
    setSideTab("edit");
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function reload() {
    const data = await fetchGuestBill();
    setBill(data);
    const next: Record<number, number> = {};
    for (const line of data.lines || []) {
      if (
        line.kind === mode &&
        String(line.fulfillmentStatus || "pending").toLowerCase() === "pending"
      ) {
        next[line.id] = Number(line.quantity) || 1;
      }
    }
    setDraftQty(next);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (e) {
        if (!cancelled) toast.error(notifyError(e, "Could not load orders"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (mode === "food_drink") {
          const menu = await fetchGuestCafeMenu();
          if (cancelled) return;
          setCatalogItems(
            menu.map((i) => ({
              id: i.id,
              name: i.name,
              price: Number(i.price) || 0,
              category: i.category || "others",
              type: i.type || "",
              imageUrl: i.imageUrl || "",
            })),
          );
        } else {
          const catalog = await fetchGuestLaundryCatalog();
          if (cancelled) return;
          setCatalogItems(
            catalog.map((i) => ({
              id: i.id,
              name: i.name,
              price: Number(i.unitPriceETB) || 0,
              category: "others",
              type: i.unitLabel || "laundry",
              imageUrl: i.imageUrl || "",
            })),
          );
        }
      } catch (e) {
        if (!cancelled) toast.error(notifyError(e, "Could not load catalog"));
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const serviceLines = useMemo(() => {
    return (bill?.lines || [])
      .filter((l) => l.kind === mode)
      .slice()
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [bill, mode]);

  const groupedRooms = useMemo(() => {
    const byRoom = new Map<string, GuestBillLine[]>();
    for (const line of serviceLines) {
      const key = line.roomNumber || "Room";
      const list = byRoom.get(key);
      if (list) list.push(line);
      else byRoom.set(key, [line]);
    }
    return [...byRoom.entries()].map(([roomNumber, lines]) => ({
      roomNumber,
      lines,
      total: lines.reduce((sum, line) => sum + Number(line.amountETB || 0), 0),
    }));
  }, [serviceLines]);

  const filteredCatalogItems = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [catalogItems, catalogSearch]);

  const addBatchLines: GuestOrderLine[] = useMemo(
    () =>
      selectedAddItems.map((item) => ({
        itemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl || "",
        quantity: addQuantities[item.id] || 1,
      })),
    [selectedAddItems, addQuantities],
  );

  const selectedLine =
    serviceLines.find((line) => line.id === selectedId) ?? serviceLines[0] ?? null;

  useEffect(() => {
    if (!selectedLine && serviceLines.length > 0) {
      setSelectedId(serviceLines[0].id);
    }
  }, [selectedLine, serviceLines]);

  function requestUpdate(line: GuestBillLine) {
    const quantity = draftQty[line.id] ?? (Number(line.quantity) || 1);
    if (quantity === Number(line.quantity)) {
      toast.message("Quantity is unchanged");
      return;
    }
    setPending({ type: "update", line, quantity });
    setOtpOpen(true);
  }

  function requestCancel(line: GuestBillLine) {
    setPending({ type: "cancel", line });
    setOtpOpen(true);
  }

  function toggleAddItem(item: CatalogItem) {
    setSelectedAddItems((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      if (exists) return prev.filter((entry) => entry.id !== item.id);
      return [...prev, item];
    });
    setAddQuantities((prev) => ({ ...prev, [item.id]: prev[item.id] || 1 }));
  }

  async function onConfirmOtp(otp: string) {
    if (!pending) return;
    setConfirming(true);
    try {
      if (pending.type === "add") {
        await guestPlaceOrder({
          otp,
          ...(mode === "food_drink"
            ? {
                foodDrink: pending.lines.map((line) => ({
                  itemId: line.itemId,
                  quantity: line.quantity,
                })),
              }
            : {
                laundry: pending.lines.map((line) => ({
                  serviceItemId: line.itemId,
                  quantity: line.quantity,
                })),
              }),
        });
        toast.success(mode === "laundry" ? "Laundry order sent" : "Order sent");
        setSelectedAddItems([]);
        setAddQuantities({});
      } else if (pending.type === "update") {
        await guestUpdateOrderLine({
          otp,
          lineId: pending.line.id,
          quantity: pending.quantity,
        });
        toast.success("Order updated");
      } else {
        await guestCancelOrderLine({
          otp,
          lineId: pending.line.id,
        });
        toast.success("Order cancelled");
      }
      await reload();
      setPending(null);
    } catch (e) {
      throw new Error(notifyError(e, "Could not update order"));
    } finally {
      setConfirming(false);
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
    <div className="space-y-5">
      <PageHero
        title={meta.title}
        description={meta.description}
        icon={<ClipboardList className="size-5" />}
      />

      <div className="grid gap-4 md:grid-cols-2 md:min-h-[calc(100dvh-16rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)] lg:min-h-[calc(100dvh-15rem)]">
          <div className="space-y-4 md:max-h-[calc(100dvh-16rem)] md:overflow-y-auto md:pr-1 lg:max-h-[calc(100dvh-15rem)]">
            {groupedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
                <Icon className="mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">{meta.empty}</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {meta.emptyBody}
                </p>
              </div>
            ) : (
              groupedRooms.map(({ roomNumber, lines, total }) => (
                <Collapsible
                  key={roomNumber}
                  defaultOpen
                  className="group/room-update overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-md ring-1 ring-black/5 dark:ring-white/10"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start rounded-none px-0 py-0 hover:bg-transparent"
                    >
                      <CardHeader className="w-full px-4 py-3 text-left">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              Room
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <CardTitle className="text-base font-semibold">
                                {roomNumber || "Room service"}
                              </CardTitle>
                              <Badge variant="secondary" className="tabular-nums">
                                {lines.length}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-bold tabular-nums">
                                {formatEtb(total)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {meta.kindLabel}
                              </p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/room-update:rotate-180" />
                          </div>
                        </div>
                      </CardHeader>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=open]:animate-in">
                    <CardContent className="space-y-2 border-t bg-muted/10 px-3 pb-3 pt-2">
                      {lines.map((line) => {
                        const status = String(
                          line.fulfillmentStatus || "pending",
                        );
                        const isSelected = selectedLine?.id === line.id;
                        const lineIcon =
                          mode === "laundry" ? (
                            <Shirt className="size-5" />
                          ) : (
                            <UtensilsCrossed className="size-5" />
                          );

                        return (
                          <div
                            key={line.id}
                            className={cn(
                              "flex gap-1.5 rounded-xl border bg-card transition-all",
                              isSelected
                                ? "border-primary shadow-sm ring-2 ring-primary/20"
                                : "hover:border-muted-foreground/25 hover:shadow-sm",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => selectLine(line.id)}
                              className={cn(
                                "flex min-w-0 flex-1 gap-3 p-3 text-left",
                                isSelected && "border-l-4 border-l-primary pl-2.5",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border/50 sm:h-14 sm:w-14",
                                  meta.iconTone,
                                )}
                              >
                                {lineIcon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold leading-tight">
                                  {cleanDescription(line.description)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Qty{" "}
                                  <span className="font-medium text-foreground">
                                    {line.quantity}
                                  </span>
                                  {" · "}
                                  <span className="font-medium text-foreground tabular-nums">
                                    {formatEtb(line.amountETB)}
                                  </span>
                                  {" · "}
                                  {formatOrderTime(line.createdAt)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <StatusBadge status={status} />
                                </div>
                              </div>
                            </button>
                            <div className="flex shrink-0 flex-col justify-center gap-1 pr-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    disabled={status.toLowerCase() !== "pending"}
                                    aria-label={`Remove ${cleanDescription(line.description)}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Cancel this item?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      &ldquo;{cleanDescription(line.description)}&rdquo; will
                                      be cancelled and won&apos;t appear at payment.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep item</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => requestCancel(line)}
                                    >
                                      Cancel item
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>

          <Card
            ref={panelRef}
            className="flex h-full min-h-[min(28rem,58dvh)] w-full min-w-0 scroll-mt-4 flex-col overflow-hidden border-primary/10 shadow-md md:min-h-[calc(100dvh-16rem)] lg:min-h-[calc(100dvh-15rem)] lg:min-w-70"
          >
            <CardHeader className="shrink-0 space-y-1 border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-base font-semibold">
                {sideTab === "edit" ? (selectedLine ? "Edit line" : "Actions") : "Add items"}
              </CardTitle>
              {sideTab === "edit" && selectedLine ? (
                <p className="truncate text-xs text-muted-foreground">
                  {cleanDescription(selectedLine.description)}
                  {selectedLine.roomNumber ? ` · Room ${selectedLine.roomNumber}` : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select an order line to update
                </p>
              )}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-0">
              <Tabs
                value={sideTab}
                onValueChange={(v) => setSideTab(v as "edit" | "add")}
                className="flex min-h-0 flex-1 flex-col gap-0"
              >
                <div className="shrink-0 border-b bg-background px-3 py-3 sm:px-4">
                  <TabsList className="grid h-10 w-full grid-cols-2">
                    <TabsTrigger value="edit" className="text-xs sm:text-sm">
                      Edit line
                    </TabsTrigger>
                    <TabsTrigger value="add" className="text-xs sm:text-sm">
                      Add items
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <TabsContent
                    value="edit"
                    className="mt-0 h-full min-h-[min(22rem,48dvh)] overflow-y-auto px-3 py-4 data-[state=inactive]:hidden sm:px-4 md:absolute md:inset-0 md:min-h-0"
                  >
                    {!selectedLine ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-12 text-center">
                        <MousePointerClick className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium">Select a line</p>
                        <p className="mt-1 max-w-55 text-xs leading-relaxed text-muted-foreground">
                          Choose an order on the left to edit its quantity or cancel it.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-full overflow-hidden rounded-xl border bg-linear-to-br from-muted/50 to-background p-3.5">
                          <div className="flex w-full gap-3">
                            <div
                              className={cn(
                                "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-16 sm:w-16",
                                meta.iconTone,
                              )}
                            >
                              <Icon className="size-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold leading-tight">
                                {cleanDescription(selectedLine.description)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {selectedLine.roomNumber
                                  ? `Room ${selectedLine.roomNumber}`
                                  : "Room service"}{" "}
                                · {meta.kindLabel}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <StatusBadge
                                  status={String(
                                    selectedLine.fulfillmentStatus || "pending",
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                          <p
                            className={cn(
                              "mt-3 border-t pt-2 text-right text-sm font-bold",
                              meta.accent,
                            )}
                          >
                            {formatEtb(selectedLine.amountETB)}
                          </p>
                        </div>

                        {String(
                          selectedLine.fulfillmentStatus || "pending",
                        ).toLowerCase() !== "pending" ? (
                          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
                            <p className="text-sm font-medium">This line is locked</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Completed or cancelled orders can no longer be updated.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Item name</label>
                              <Input
                                value={cleanDescription(selectedLine.description)}
                                disabled
                                className="h-12 text-base"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Quantity</label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-11 w-11"
                                  onClick={() =>
                                    setDraftQty((prev) => ({
                                      ...prev,
                                      [selectedLine.id]: Math.max(
                                        1,
                                        (draftQty[selectedLine.id] ??
                                          (Number(selectedLine.quantity) || 1)) - 1,
                                      ),
                                    }))
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  value={String(
                                    draftQty[selectedLine.id] ??
                                      (Number(selectedLine.quantity) || 1),
                                  )}
                                  onChange={(e) => {
                                    const next = Number(e.target.value);
                                    setDraftQty((prev) => ({
                                      ...prev,
                                      [selectedLine.id]:
                                        Number.isFinite(next) && next > 0
                                          ? next
                                          : 1,
                                    }));
                                  }}
                                  inputMode="numeric"
                                  className="h-11 text-center text-base font-semibold"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-11 w-11"
                                  onClick={() =>
                                    setDraftQty((prev) => ({
                                      ...prev,
                                      [selectedLine.id]:
                                        (draftQty[selectedLine.id] ??
                                          (Number(selectedLine.quantity) || 1)) + 1,
                                    }))
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="rounded-xl border bg-muted/20 p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Updated total</span>
                                <span className="font-semibold tabular-nums">
                                  {formatEtb(
                                    (draftQty[selectedLine.id] ??
                                      (Number(selectedLine.quantity) || 1)) *
                                      (Number(selectedLine.unitPriceETB) || 0),
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button onClick={() => requestUpdate(selectedLine)}>
                                Update line
                              </Button>
                              <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => requestCancel(selectedLine)}
                              >
                                Cancel order
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="add"
                    className="mt-0 h-full min-h-[min(22rem,48dvh)] overflow-y-auto px-3 py-4 data-[state=inactive]:hidden sm:px-4 md:absolute md:inset-0 md:min-h-0"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Search menu</label>
                        <Input
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder={
                            mode === "laundry"
                              ? "Search laundry items"
                              : "Search food and drink"
                          }
                          className="h-11"
                        />
                      </div>

                      {catalogLoading ? (
                        <div className="flex justify-center py-10">
                          <Spinner className="size-5 text-primary" />
                        </div>
                      ) : filteredCatalogItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
                          <p className="text-sm font-medium">No matching items</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Try a different search.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredCatalogItems.map((item) => {
                            const selected = selectedAddItems.some(
                              (entry) => entry.id === item.id,
                            );
                            const qty = addQuantities[item.id] || 1;
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "rounded-xl border p-3 transition-all",
                                  selected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/15"
                                    : "bg-card hover:border-muted-foreground/25",
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                      {item.name}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.type || meta.kindLabel}
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                                    {formatEtb(item.price)}
                                  </p>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-sm">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      onClick={() =>
                                        setAddQuantities((prev) => ({
                                          ...prev,
                                          [item.id]: Math.max(1, qty - 1),
                                        }))
                                      }
                                    >
                                      <Minus className="size-3.5" />
                                    </Button>
                                    <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                                      {qty}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      onClick={() =>
                                        setAddQuantities((prev) => ({
                                          ...prev,
                                          [item.id]: qty + 1,
                                        }))
                                      }
                                    >
                                      <Plus className="size-3.5" />
                                    </Button>
                                  </div>
                                  <Button
                                    type="button"
                                    variant={selected ? "secondary" : "outline"}
                                    onClick={() => toggleAddItem(item)}
                                  >
                                    {selected ? "Selected" : "Add item"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="rounded-xl border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">
                            {selectedAddItems.length} selected
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatEtb(
                              addBatchLines.reduce(
                                (sum, line) => sum + line.price * line.quantity,
                                0,
                              ),
                            )}
                          </span>
                        </div>
                        <Button
                          className="mt-3 w-full"
                          disabled={addBatchLines.length === 0}
                          onClick={() => setBatchOpen(true)}
                        >
                          Review and send
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

      <OtpConfirmDialog
        open={otpOpen}
        onOpenChange={(open) => {
          setOtpOpen(open);
          if (!open) setPending(null);
        }}
        confirming={confirming}
        title={
          pending?.type === "cancel"
            ? "Cancel with room code"
            : "Update with room code"
        }
        description={
          pending?.type === "cancel"
            ? "Enter your 6-digit room code to cancel this pending order."
            : "Enter your 6-digit room code to save the new quantity."
        }
        onConfirm={onConfirmOtp}
      />

      <GuestBatchReviewModal
        open={batchOpen}
        onOpenChange={setBatchOpen}
        lines={addBatchLines}
        onChangeLines={(lines) => {
          const byId = new Map(selectedAddItems.map((item) => [item.id, item]));
          setSelectedAddItems(
            lines
              .map((line) => byId.get(line.itemId))
              .filter((item): item is CatalogItem => Boolean(item)),
          );
          setAddQuantities(
            Object.fromEntries(lines.map((line) => [line.itemId, line.quantity])),
          );
        }}
        onApprove={() => {
          setPending({ type: "add", lines: addBatchLines });
          setBatchOpen(false);
          setOtpOpen(true);
        }}
        mode={mode}
      />
    </div>
  );
}

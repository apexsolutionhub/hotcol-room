"use client";

import Image from "next/image";
import { APEX_SOLUTION, HOTCOL_SYSTEM } from "@/constants/branding";
import type { GuestStay } from "@/lib/api/guest";
import { cn } from "@/lib/utils";

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900 wrap-break-word">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}

export function GuestRegistrationCard({ stay }: { stay: GuestStay }) {
  const property =
    (stay.property?.displayName || stay.HotelName || "Property").trim() ||
    "Property";
  const tin = (stay.property?.tinNumber || "").trim();
  const logoUrl = (stay.property?.logoUrl || "").trim();
  const guest = stay.guest;
  const guestName =
    `${guest.firstName || ""} ${guest.lastName || ""}`.trim() || "Guest";
  const rooms = stay.rooms
    .map((r) => r.roomNumber)
    .filter(Boolean)
    .join(", ");
  const roomTypes = [
    ...new Set(stay.rooms.map((r) => r.roomType).filter(Boolean)),
  ].join(", ");
  const idLabel = guest.isEthiopian ? "National ID / Fayda" : "Passport";
  const idValue = guest.isEthiopian
    ? guest.nationalId
    : guest.passportNumber || guest.nationalId;
  const expectedNights = stay.expectedNights || stay.nights || 1;
  const expectedDeparture =
    stay.expectedDepartureAt || stay.departureAt || null;

  return (
    <div
      id="guest-registration-card"
      className="guest-print-doc mx-auto max-w-[210mm] bg-white font-sans text-zinc-900 print:text-black"
    >
      <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-8 print:px-6 print:pt-6">
        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {logoUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-600/25 shadow-sm sm:h-16 sm:w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`${property} logo`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-lg font-bold text-emerald-800 sm:h-16 sm:w-16">
                {property.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                Guest registration
              </p>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                Registration card
              </h1>
              <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-800">
                {property}
              </p>
              <p className="mt-0.5 text-sm text-zinc-600">
                Hotel TIN: {tin || "—"}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-600">
                Voucher {stay.voucherCode || "—"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5">
              <Image
                src={HOTCOL_SYSTEM.logoPath}
                alt={HOTCOL_SYSTEM.name}
                width={28}
                height={28}
                className="rounded-md object-cover"
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {HOTCOL_SYSTEM.name}
              </span>
            </div>
            <p className="text-right text-xs font-semibold text-zinc-800">
              {formatWhen(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-6 h-1 rounded-full bg-linear-to-r from-emerald-600 via-emerald-400 to-teal-500 sm:mx-8 print:mx-6" />

      <div className="space-y-5 px-6 py-5 sm:px-8 print:px-6">
        <section className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Guest
          </h3>
          <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-2">
            <Field label="Full name" value={guestName} className="sm:col-span-2" />
            <Field label="Phone" value={guest.phone} />
            <Field label="Secondary phone" value={guest.phoneSecondary} />
            <Field label="Email" value={guest.email} />
            <Field label="Sex" value={guest.sex} />
            <Field label="Nationality" value={guest.country} />
            <Field
              label="Guest type"
              value={guest.isEthiopian ? "Ethiopian" : "Foreign"}
            />
            <Field label={idLabel} value={idValue} className="sm:col-span-2" />
            <Field label="Region / state" value={guest.stateRegion} />
            <Field label="Address" value={guest.addressLine} />
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Stay
          </h3>
          <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-2">
            <Field label="Room(s)" value={rooms} />
            <Field label="Room type" value={roomTypes} />
            <Field label="Arrival" value={formatWhen(stay.arrivalAt)} />
            <Field
              label="Expected departure"
              value={formatWhen(expectedDeparture)}
            />
            <Field label="Expected nights" value={String(expectedNights)} />
            <Field
              label="Guests"
              value={`${stay.adults || 1} adult${(stay.adults || 1) === 1 ? "" : "s"}${
                stay.children
                  ? `, ${stay.children} child${stay.children === 1 ? "" : "ren"}`
                  : ""
              }`}
            />
            <Field label="Status" value={stay.status.replace(/_/g, " ")} />
            <Field label="Property phone" value={stay.property?.hotelPhone || ""} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Signatures
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Guest signature", name: guestName },
              { label: "Reception signature", name: "" },
            ].map((entry) => (
              <div
                key={entry.label}
                className="flex min-w-0 items-end gap-3 rounded-xl border border-zinc-200 bg-white p-3"
              >
                <div className="min-w-22 max-w-40 shrink-0 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider leading-tight text-zinc-500">
                    {entry.label}
                  </p>
                  <p className="text-xs font-medium leading-tight text-zinc-700 wrap-break-word">
                    {entry.name?.trim() || "—"}
                  </p>
                </div>
                <div
                  className="mb-1 h-5 min-w-10 flex-1 border-b-2 border-zinc-400"
                  aria-label={`${entry.label} line`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mx-6 mb-6 rounded-xl border border-emerald-200/90 bg-linear-to-br from-emerald-50 via-white to-amber-50 px-4 py-3 shadow-sm sm:mx-8 sm:mb-8 sm:px-5 sm:py-4 print:mx-6 print:mb-6 print:border-emerald-300 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg border border-emerald-100 bg-white/90 px-2 py-1.5 shadow-sm">
              <Image
                src={APEX_SOLUTION.logoPath}
                alt={APEX_SOLUTION.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain sm:h-9"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-950 sm:text-base">
                {APEX_SOLUTION.name}
              </p>
              <a
                href={APEX_SOLUTION.website}
                className="text-xs text-emerald-800/80 underline-offset-2 hover:underline hover:text-emerald-950 sm:text-sm"
              >
                {APEX_SOLUTION.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
          <div className="max-w-[220px] text-right text-[10px] text-zinc-600">
            <p>
              Powered by{" "}
              <span className="font-medium text-emerald-900">
                {HOTCOL_SYSTEM.name}
              </span>{" "}
              lodging
            </p>
            <p className="mt-0.5">Printed {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

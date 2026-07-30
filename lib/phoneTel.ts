/** Build a tel: href from a stored hotel phone, or null if unusable. */
export function toTelHref(phone: string | null | undefined): string | null {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return `tel:${cleaned.startsWith("+") ? `+${digits}` : digits}`;
}

export type HotelCallOption = {
  key: "primary" | "secondary";
  label: string;
  phone: string;
  href: string;
};

/** Collect dialable hotel lines (primary required, secondary optional). */
export function hotelCallOptions(property: {
  hotelPhone?: string | null;
  hotelPhoneSecondary?: string | null;
} | null | undefined): HotelCallOption[] {
  const options: HotelCallOption[] = [];
  const primaryHref = toTelHref(property?.hotelPhone);
  if (primaryHref && property?.hotelPhone) {
    options.push({
      key: "primary",
      label: "Primary",
      phone: String(property.hotelPhone).trim(),
      href: primaryHref,
    });
  }
  const secondaryHref = toTelHref(property?.hotelPhoneSecondary);
  if (secondaryHref && property?.hotelPhoneSecondary) {
    options.push({
      key: "secondary",
      label: "Secondary",
      phone: String(property.hotelPhoneSecondary).trim(),
      href: secondaryHref,
    });
  }
  return options;
}

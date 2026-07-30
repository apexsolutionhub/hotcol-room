const TOKEN_KEY = "hotcol_room_guest_token";
const STAY_KEY = "hotcol_room_guest_stay";

export type StoredGuestStay = {
  id: number;
  voucherCode: string;
  status: string;
  HotelName: string;
  guest: { firstName: string; lastName: string; phone: string };
  rooms: Array<{ id: number; roomNumber: string; roomType: string }>;
  property?: {
    tinNumber: string;
    displayName: string;
    logoUrl?: string | null;
    hotelPhone?: string | null;
    hotelPhoneSecondary?: string | null;
  } | null;
};

export function readGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function writeGuestSession(token: string, stay: StoredGuestStay) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(STAY_KEY, JSON.stringify(stay));
}

export function readStoredStay(): StoredGuestStay | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STAY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredGuestStay;
  } catch {
    return null;
  }
}

export function clearGuestSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STAY_KEY);
}

export function isGuestLoggedIn(): boolean {
  return Boolean(readGuestToken());
}

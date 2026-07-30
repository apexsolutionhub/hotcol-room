"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { guestLogin } from "@/lib/api/guest";
import { notifyError } from "@/lib/api/client";
import {
  clearGuestSession,
  isGuestLoggedIn,
  writeGuestSession,
} from "@/lib/guestSession";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otpFromQr = (searchParams.get("otp") || "").replace(/\D/g, "").slice(0, 6);

  const [otp, setOtp] = useState(otpFromQr);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const submittedFor = useRef<string | null>(null);

  useEffect(() => {
    if (isGuestLoggedIn()) {
      router.replace("/home");
      return;
    }
    setChecking(false);
  }, [router]);

  useEffect(() => {
    if (otpFromQr) setOtp(otpFromQr);
  }, [otpFromQr]);

  useEffect(() => {
    if (checking || submitting || otp.length !== 6) return;
    if (submittedFor.current === otp) return;
    submittedFor.current = otp;

    async function login() {
      setSubmitting(true);
      try {
        const session = await guestLogin({ otp });
        writeGuestSession(session.token, {
          id: session.stay.id,
          voucherCode: session.stay.voucherCode,
          status: session.stay.status,
          HotelName: session.stay.HotelName,
          guest: session.stay.guest,
          rooms: session.stay.rooms,
          property: session.stay.property,
        });
        toast.success("Welcome — your room is connected");
        router.replace("/home");
      } catch (err) {
        clearGuestSession();
        submittedFor.current = null;
        setOtp("");
        toast.error(notifyError(err, "Could not sign in"));
      } finally {
        setSubmitting(false);
      }
    }

    void login();
  }, [otp, checking, submitting, router]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-linear-to-b from-background via-muted/20 to-muted/40">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-muted/40">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-background via-background to-primary/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="guest-animate-in mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/30">
            <span className="text-sm font-bold tracking-tight">HC</span>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-primary md:text-xs">
            HotCol Room
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Enter your room code
          </h1>
          <p className="mt-2 text-sm text-pretty text-muted-foreground">
            Use the 6-digit code from check-in. That is all you need — it is
            unique to your stay until checkout.
          </p>
        </div>

        <div
          className="guest-animate-in relative overflow-hidden space-y-5 rounded-2xl border border-primary/20 bg-card/95 p-5 shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10 sm:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/60 via-sky-500/45 to-emerald-500/40" />

          <div className="space-y-3">
            <Label className="flex justify-center">Room code</Label>
            <div className="flex justify-center overflow-x-auto px-1">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                autoFocus
                disabled={submitting}
                containerClassName="gap-1.5 sm:gap-2"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPGroup key={i}>
                    <InputOTPSlot
                      index={i}
                      className="size-9 rounded-lg border text-base sm:size-10"
                    />
                  </InputOTPGroup>
                ))}
              </InputOTP>
            </div>
          </div>

          {submitting ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4 text-primary" />
              Connecting…
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Approving food, drink, or laundry also asks for this same code.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-linear-to-b from-background via-muted/20 to-muted/40">
          <Spinner className="size-6 text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

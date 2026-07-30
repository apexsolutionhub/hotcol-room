"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirming?: boolean;
  onConfirm: (otp: string) => Promise<void> | void;
};

export function OtpConfirmDialog({
  open,
  onOpenChange,
  title = "Approve with room code",
  description = "Enter the 6-digit code from check-in to confirm this order. It stays valid until checkout.",
  confirming,
  onConfirm,
}: Props) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittedFor = useRef<string | null>(null);
  const busy = confirming || submitting;

  useEffect(() => {
    if (!open) {
      setOtp("");
      setError("");
      setSubmitting(false);
      submittedFor.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || busy || otp.length !== 6) return;
    if (submittedFor.current === otp) return;
    submittedFor.current = otp;

    async function approve() {
      setError("");
      setSubmitting(true);
      try {
        await onConfirm(otp);
        setOtp("");
        onOpenChange(false);
      } catch (e) {
        submittedFor.current = null;
        setOtp("");
        setError(e instanceof Error ? e.message : "Could not confirm");
      } finally {
        setSubmitting(false);
      }
    }

    void approve();
  }, [otp, open, busy, onConfirm, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        if (!next) {
          setOtp("");
          setError("");
          submittedFor.current = null;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="overflow-hidden border-primary/20 bg-card/95 shadow-xl ring-1 ring-black/5 sm:max-w-md dark:ring-white/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/60 via-sky-500/45 to-emerald-500/40" />
        <DialogHeader className="pr-8 text-center sm:text-center">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col items-center gap-4 overflow-x-auto py-2">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            autoFocus
            disabled={busy}
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
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {busy ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4 text-primary" />
              Approving…
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Submits automatically when all 6 digits are entered
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

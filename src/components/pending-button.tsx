"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type PendingButtonProps = {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
  type?: "submit" | "button" | "reset";
};

export default function PendingButton({
  children,
  pendingText = "Procesando...",
  className = "btn",
  disabled = false,
  type = "submit",
}: PendingButtonProps) {
  const { pending } = useFormStatus();
  const busy = pending && type === "submit";

  return (
    <button type={type} className={className} disabled={disabled || busy} aria-busy={busy}>
      {busy && <span className="button-spinner" aria-hidden="true" />}
      {busy ? pendingText : children}
    </button>
  );
}

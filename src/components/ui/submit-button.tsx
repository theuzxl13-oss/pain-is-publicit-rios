"use client";

import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";

export function SubmitButton({
  pending,
  pendingText = "Enviando…",
  children,
  ...props
}: ButtonProps & { pending: boolean; pendingText?: string }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden /> {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

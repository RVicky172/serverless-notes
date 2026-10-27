import type { ReactNode } from "react";

const tones = {
  error: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-200",
} as const;

/** Props for {@link Alert}. */
export interface AlertProps {
  /** `error` is announced immediately to screen readers; `info` politely. */
  tone?: keyof typeof tones;
  children: ReactNode;
}

/**
 * Inline message box for errors and notices.
 *
 * @param props - Tone and message content.
 */
export function Alert({ tone = "error", children }: AlertProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md px-3 py-2 text-sm ring-1 ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

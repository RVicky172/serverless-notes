import type { ComponentProps } from "react";

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  danger: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
  link: "text-indigo-600 hover:underline px-0 py-0",
} as const;

/** Props for {@link Button}. */
export interface ButtonProps extends ComponentProps<"button"> {
  /** Visual style. Defaults to `primary`. */
  variant?: keyof typeof variants;
  /** Disables the button and shows a busy label while an action runs. */
  pending?: boolean;
}

/**
 * Styled button. Defaults to `type="button"` so it never submits a form by accident.
 *
 * @param props - Standard button props plus `variant` and `pending`.
 */
export function Button({
  variant = "primary",
  pending = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || pending}
      aria-busy={pending}
      className={`rounded-md px-3 py-2 text-sm font-semibold shadow-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

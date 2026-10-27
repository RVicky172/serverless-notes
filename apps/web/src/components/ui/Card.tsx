import type { ComponentProps } from "react";

/**
 * White rounded panel used to group content.
 *
 * @param props - Standard `<div>` props.
 */
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 ${className}`}
      {...props}
    />
  );
}

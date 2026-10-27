import { useId, type ComponentProps } from "react";

const inputClass =
  "block w-full rounded-md bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none";

/** Props for {@link TextField}. */
export interface TextFieldProps extends ComponentProps<"input"> {
  /** Visible label, also used as the accessible name. */
  label: string;
}

/**
 * Labelled single-line input.
 *
 * @param props - Standard input props plus `label`.
 */
export function TextField({ label, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input id={inputId} className={inputClass} {...props} />
    </div>
  );
}

/** Props for {@link TextAreaField}. */
export interface TextAreaFieldProps extends ComponentProps<"textarea"> {
  /** Visible label, also used as the accessible name. */
  label: string;
}

/**
 * Labelled multi-line input.
 *
 * @param props - Standard textarea props plus `label`.
 */
export function TextAreaField({ label, id, ...props }: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea id={inputId} rows={3} className={inputClass} {...props} />
    </div>
  );
}

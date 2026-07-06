import { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  mono?: boolean;
}

export default function FormField({ label, hint, mono = false, ...inputProps }: FormFieldProps) {
  return (
    <label className="block">
      <span className="font-sans text-[13px] text-label-2 block mb-1.5">
        {label}
        {hint && <span className="text-label-3 text-[12px] ml-1">({hint})</span>}
      </span>
      <input
        className={`w-full bg-surface border border-stroke rounded-xl px-4 py-3 ${
          mono ? "font-mono text-[13px]" : "font-sans text-[14px]"
        } text-label placeholder:text-label-3 focus:outline-none focus:border-yellow transition-colors`}
        {...inputProps}
      />
    </label>
  );
}

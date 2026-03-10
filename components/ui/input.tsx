import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[var(--input)] bg-white px-4 py-3 text-sm text-[var(--foreground)] shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] ${className}`}
    />
  );
}
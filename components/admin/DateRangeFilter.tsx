"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { DateFilter } from "@/lib/admin/date-filter";

type Props = {
  initialFilter: DateFilter;
};

export function DateRangeFilter({ initialFilter }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(initialFilter?.from ?? "");
  const [to, setTo]     = useState(initialFilter?.to   ?? "");

  function handleApply() {
    const params = new URLSearchParams(searchParams.toString());

    if (from || to) {
      params.set("from", from || to);
      params.set("to",   to   || from);
    } else {
      params.delete("from");
      params.delete("to");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClear() {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilter = Boolean(from || to);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">De</label>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Até</label>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <button
        onClick={handleApply}
        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Aplicar
      </button>

      {hasFilter && (
        <button
          onClick={handleClear}
          className="h-9 rounded-md border border-input px-4 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          Limpar filtro
        </button>
      )}

      {hasFilter && (
        <span className="self-end pb-1 text-xs text-muted-foreground">
          {from === to || (!from && !to)
            ? `Dia: ${formatDate(from || to)}`
            : `${from ? formatDate(from) : "início"} → ${to ? formatDate(to) : "hoje"}`}
        </span>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

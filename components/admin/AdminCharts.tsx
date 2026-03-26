"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "@/components/ui/card";
import type { AdminCertificate, AdminStoreMetric, AdminUser } from "@/lib/admin/types";

type Props = {
  users: AdminUser[];
  certificates: AdminCertificate[];
  stores: AdminStoreMetric[];
};

const USER_BAR_COLOR = "#93c5fd";
const SUCCESS_BAR_COLOR = "#86efac";
const STORE_BAR_COLOR = "#fcd34d";

function getMonthKey(dateString?: string | null) {
  if (!dateString || dateString.length < 7) return null;
  return dateString.slice(0, 7);
}

function getDayKey(dateString?: string | null) {
  if (!dateString || dateString.length < 10) return null;
  return dateString.slice(0, 10);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function groupUsersByMonth(users: AdminUser[]) {
  const map = new Map<string, number>();

  users.forEach((user) => {
    const key = getMonthKey(user.created_at);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      key,
      label: formatMonthLabel(key),
      total,
    }));
}

function groupUsersByDay(users: AdminUser[]) {
  const map = new Map<string, number>();

  users.forEach((user) => {
    const key = getDayKey(user.created_at);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      key,
      label: formatDayLabel(key),
      total,
    }));
}

function groupCertificatesByMonth(certificates: AdminCertificate[]) {
  const map = new Map<string, number>();

  certificates.forEach((certificate) => {
    const key = getMonthKey(certificate.issued_at);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      key,
      label: formatMonthLabel(key),
      total,
    }));
}

function buildStoreSelectionChart(stores: AdminStoreMetric[]) {
  return [...stores]
    .sort((a, b) => b.selectedUsers - a.selectedUsers)
    .slice(0, 10)
    .map((store) => ({
      label: store.storeName,
      total: store.selectedUsers,
    }));
}

function splitLabelIntoLines(label: string, maxCharsPerLine = 12) {
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const next = currentLine ? `${currentLine} ${word}` : word;

    if (next.length <= maxCharsPerLine) {
      currentLine = next;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

type MultilineYAxisTickProps = {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
};

function MultilineYAxisTick({
  x = 0,
  y = 0,
  payload,
}: MultilineYAxisTickProps) {
  const value = payload?.value ?? "";
  const lines = splitLabelIntoLines(value, 12);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        textAnchor="end"
        fill="#475569"
        fontSize={12}
      >
        {lines.map((line, index) => (
          <tspan
            key={`${line}-${index}`}
            x={0}
            dy={index === 0 ? -6 : 14}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export default function AdminCharts({ users, certificates, stores }: Props) {
  const usersByMonth = useMemo(() => groupUsersByMonth(users), [users]);
  const usersByDay = useMemo(() => groupUsersByDay(users), [users]);

  const certificatesByMonth = useMemo(
    () => groupCertificatesByMonth(certificates),
    [certificates]
  );

  const progressDistribution = useMemo(() => {
    const ranges = [
      { label: "0-25%", total: 0 },
      { label: "26-50%", total: 0 },
      { label: "51-75%", total: 0 },
      { label: "76-100%", total: 0 },
    ];

    users.forEach((user) => {
      const progress = user.progress ?? 0;

      if (progress <= 25) ranges[0].total += 1;
      else if (progress <= 50) ranges[1].total += 1;
      else if (progress <= 75) ranges[2].total += 1;
      else ranges[3].total += 1;
    });

    return ranges;
  }, [users]);

  const storesBySelection = useMemo(() => buildStoreSelectionChart(stores), [stores]);

  const storesChartHeight = Math.max(360, storesBySelection.length * 52);

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <Card className="rounded-2xl border-slate-200 xl:col-span-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Novos usuários por mês
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill={USER_BAR_COLOR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Distribuição de progresso
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill={SUCCESS_BAR_COLOR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 xl:col-span-3">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Novos usuários por dia
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill={USER_BAR_COLOR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 xl:col-span-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Certificados emitidos por mês
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={certificatesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill={SUCCESS_BAR_COLOR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 xl:col-span-1">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Top 10 lojas por seleção
          </h2>

          <div style={{ height: storesChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={storesBySelection}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 8, left: 20 }}
                barCategoryGap={14}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={<MultilineYAxisTick />}
                />
                <Tooltip
                  formatter={(value) => [`${value}`, "Total"]}
                  labelFormatter={(label) => `Loja: ${label}`}
                />
                <Bar
                  dataKey="total"
                  fill={STORE_BAR_COLOR}
                  radius={[0, 8, 8, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </section>
  );
}

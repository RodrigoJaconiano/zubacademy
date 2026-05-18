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
import type {
  AdminCertificate,
  AdminCertificateByBrand,
  AdminStoreMetric,
  AdminUser,
} from "@/lib/admin/types";

type Props = {
  users: AdminUser[];
  certificates: AdminCertificate[];
  certificatesByBrand?: AdminCertificateByBrand[];
  stores: AdminStoreMetric[];
};

const USER_BAR_COLOR = "#93c5fd";
const SUCCESS_BAR_COLOR = "#86efac";

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

function groupCertificatesByBrand(certificates: AdminCertificate[]) {
  const map = new Map<
    string,
    {
      key: string;
      label: string;
      total: number;
    }
  >();

  certificates.forEach((certificate) => {
    const key = certificate.brandSlug || certificate.brandName;
    const label = certificate.brandName || "Marca não identificada";

    const current = map.get(key);

    if (current) {
      current.total += 1;
      return;
    }

    map.set(key, {
      key,
      label,
      total: 1,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export default function AdminCharts({
  users,
  certificates,
  certificatesByBrand = [],
}: Props) {
  const usersByMonth = useMemo(() => groupUsersByMonth(users), [users]);
  const usersByDay = useMemo(() => groupUsersByDay(users), [users]);

  const brandCertificateData = useMemo(() => {
    if (certificatesByBrand.length > 0) {
      return certificatesByBrand.map((item) => ({
        key: item.brandSlug,
        label: item.brandName,
        total: item.total,
      }));
    }

    return groupCertificatesByBrand(certificates);
  }, [certificates, certificatesByBrand]);

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
                <Bar
                  dataKey="total"
                  fill={USER_BAR_COLOR}
                  radius={[8, 8, 0, 0]}
                />
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
                <Bar
                  dataKey="total"
                  fill={SUCCESS_BAR_COLOR}
                  radius={[8, 8, 0, 0]}
                />
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
                <Bar
                  dataKey="total"
                  fill={USER_BAR_COLOR}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 xl:col-span-3">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Certificados por marca
          </h2>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandCertificateData}
                margin={{ top: 8, right: 16, bottom: 32, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />

                <YAxis allowDecimals={false} />

                <Tooltip
                  formatter={(value) => [`${value}`, "Certificados"]}
                  labelFormatter={(label) => `Marca: ${label}`}
                />

                <Bar
                  dataKey="total"
                  fill={SUCCESS_BAR_COLOR}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </section>
  );
}

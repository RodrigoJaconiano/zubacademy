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
  LineChart,
  Line,
} from "recharts";
import Card from "@/components/ui/card";

type Profile = {
  id: string;
  created_at?: string | null;
  progress?: number | null;
};

type Certificate = {
  id: string;
  issued_at?: string | null;
};

type Props = {
  profiles: Profile[];
  certificates: Certificate[];
};

function formatMonthKey(dateString?: string | null) {
  if (!dateString) return "Sem data";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export default function AdminCharts({ profiles, certificates }: Props) {
  const usersByMonth = useMemo(() => {
    const map = new Map<string, number>();

    profiles.forEach((profile) => {
      const key = formatMonthKey(profile.created_at);
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([month, total]) => ({
      month,
      total,
    }));
  }, [profiles]);

  const certificatesByMonth = useMemo(() => {
    const map = new Map<string, number>();

    certificates.forEach((certificate) => {
      const key = formatMonthKey(certificate.issued_at);
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([month, total]) => ({
      month,
      total,
    }));
  }, [certificates]);

  const progressDistribution = useMemo(() => {
    const ranges = [
      { label: "0-25%", total: 0 },
      { label: "26-50%", total: 0 },
      { label: "51-75%", total: 0 },
      { label: "76-100%", total: 0 },
    ];

    profiles.forEach((profile) => {
      const progress = profile.progress ?? 0;

      if (progress <= 25) ranges[0].total += 1;
      else if (progress <= 50) ranges[1].total += 1;
      else if (progress <= 75) ranges[2].total += 1;
      else ranges[3].total += 1;
    });

    return ranges;
  }, [profiles]);

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
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
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
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 xl:col-span-3">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Certificados emitidos por mês
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={certificatesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </section>
  );
}

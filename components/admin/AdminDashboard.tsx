"use client";

import AdminStatsCards from "./AdminStatsCards";
import AdminCharts from "./AdminCharts";
import AdminUsersTable from "./AdminUserTable";

type Profile = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  created_at?: string | null;
  progress?: number | null;
};

type Certificate = {
  id: string;
  user_id?: string | null;
  certificate_code?: string | null;
  issued_at?: string | null;
  course_slug?: string | null;
};

type AdminDashboardProps = {
  profiles: Profile[];
  certificates: Certificate[];
};

export default function AdminDashboard({
  profiles,
  certificates,
}: AdminDashboardProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Painel Administrativo
        </h1>
        <p className="text-sm text-slate-600">
          Visão geral dos usuários, progresso e certificados da plataforma.
        </p>
      </section>

      <AdminStatsCards profiles={profiles} certificates={certificates} />
      <AdminCharts profiles={profiles} certificates={certificates} />
      <AdminUsersTable profiles={profiles} certificates={certificates} />
    </main>
  );
}

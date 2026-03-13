"use client";

import AdminStatsCards from "./AdminStatsCards";
import AdminCharts from "./AdminCharts";
import AdminUsersTable from "./AdminUserTable";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  app_role: string | null;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  isComplete: boolean;
  hasCertificate: boolean;
  certificateCount: number;
  quizAttempts: number;
  bestQuizScore: number | null;
  quizPassed: boolean;
  lastQuizAt: string | null;
};

export type AdminCertificate = {
  id: string;
  user_id?: string | null;
  certificate_code?: string | null;
  issued_at?: string | null;
  course_slug?: string | null;
};

type AdminDashboardProps = {
  users: AdminUser[];
  certificates: AdminCertificate[];
};

export default function AdminDashboard({
  users,
  certificates,
}: AdminDashboardProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Painel Administrativo
        </h1>
        <p className="text-sm text-slate-600">
          Visão geral dos usuários, progresso, quiz e certificados da plataforma.
        </p>
      </section>

      <AdminStatsCards users={users} certificates={certificates} />
      <AdminCharts users={users} certificates={certificates} />
      <AdminUsersTable users={users} />
    </main>
  );
}

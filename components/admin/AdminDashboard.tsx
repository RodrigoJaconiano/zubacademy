"use client";

import AdminStatsCards from "./AdminStatsCards";
import AdminCharts from "./AdminCharts";
import AdminUsersTable from "./AdminUserTable";
import Button from "@/components/ui/Button";

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
  missingItems: string[];
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

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function AdminDashboard({
  users,
  certificates,
}: AdminDashboardProps) {
  function handleDownloadUsersCsv() {
    downloadCsv(
      "usuarios-admin.csv",
      users.map((user) => ({
        id: user.id,
        nome: user.name ?? "",
        email: user.email ?? "",
        cpf: user.cpf ?? "",
        telefone: user.phone ?? "",
        role: user.app_role ?? "",
        perfil_completo: user.isComplete ? "Sim" : "Não",
        pendencias: user.missingItems.join(" | "),
        progresso_percentual: user.progress,
        aulas_concluidas: user.completedLessons,
        total_aulas: user.totalLessons,
        quiz_tentativas: user.quizAttempts,
        quiz_melhor_score: user.bestQuizScore ?? "",
        quiz_aprovado: user.quizPassed ? "Sim" : "Não",
        possui_certificado: user.hasCertificate ? "Sim" : "Não",
        quantidade_certificados: user.certificateCount,
        criado_em: user.created_at ?? "",
        atualizado_em: user.updated_at ?? "",
        ultimo_quiz_em: user.lastQuizAt ?? "",
      }))
    );
  }

  function handleDownloadCertificatesCsv() {
    downloadCsv(
      "certificados-admin.csv",
      certificates.map((certificate) => ({
        id: certificate.id,
        user_id: certificate.user_id ?? "",
        certificate_code: certificate.certificate_code ?? "",
        issued_at: certificate.issued_at ?? "",
        course_slug: certificate.course_slug ?? "",
      }))
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel Administrativo
          </h1>
          <p className="text-sm text-slate-600">
            Visão geral dos usuários, progresso, quiz e certificados da plataforma.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={handleDownloadUsersCsv} className="sm:w-auto">
            Baixar CSV de usuários
          </Button>

          <Button
            type="button"
            onClick={handleDownloadCertificatesCsv}
            className="sm:w-auto"
          >
            Baixar CSV de certificados
          </Button>
        </div>
      </section>

      <AdminStatsCards users={users} certificates={certificates} />
      <AdminCharts users={users} certificates={certificates} />
      <AdminUsersTable users={users} />
    </main>
  );
}

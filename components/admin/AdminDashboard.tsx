"use client";

import AdminStatsCards from "./AdminStatsCards";
import AdminCharts from "./AdminCharts";
import AdminUsersTable from "./AdminUserTable";
import AdminFunnelCards from "./AdminFunnelCards";
import AdminStoreTable from "./AdminStoreTable";
import { DateRangeFilter } from "./DateRangeFilter";
import Button from "@/components/ui/Button";
import {
  downloadCsv,
  mapCertificatesToCsvRows,
  mapStoresToCsvRows,
  mapUsersToCsvRows,
} from "@/lib/admin/exports";
import type {
  AdminCertificate,
  AdminFunnel,
  AdminStoreMetric,
  AdminSummary,
  AdminUser,
} from "@/lib/admin/types";
import type { DateFilter } from "@/lib/admin/date-filter";

type AdminDashboardProps = {
  users: AdminUser[];
  certificates: AdminCertificate[];
  summary: AdminSummary;
  funnel: AdminFunnel;
  stores: AdminStoreMetric[];
  dateFilter: DateFilter;
};

export default function AdminDashboard({
  users,
  certificates,
  summary,
  funnel,
  stores,
  dateFilter,
}: AdminDashboardProps) {
  function handleDownloadUsersCsv() {
    downloadCsv("usuarios-admin.csv", mapUsersToCsvRows(users));
  }

  function handleDownloadCertificatesCsv() {
    downloadCsv("certificados-admin.csv", mapCertificatesToCsvRows(certificates));
  }

  function handleDownloadStoresCsv() {
    downloadCsv("lojas-admin.csv", mapStoresToCsvRows(stores));
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel Administrativo
          </h1>
          <p className="text-sm text-slate-600">
            Visão geral dos usuários, progresso, unidades, quiz e certificados da plataforma.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={handleDownloadUsersCsv} className="sm:w-auto">
            Baixar CSV de usuários
          </Button>
          <Button type="button" onClick={handleDownloadCertificatesCsv} className="sm:w-auto">
            Baixar CSV de certificados
          </Button>
          <Button type="button" onClick={handleDownloadStoresCsv} className="sm:w-auto">
            Baixar CSV de lojas
          </Button>
        </div>
      </section>

      <DateRangeFilter initialFilter={dateFilter} />

      <AdminStatsCards summary={summary} />
      <AdminFunnelCards funnel={funnel} />
      <AdminCharts users={users} certificates={certificates} stores={stores} />
      <AdminStoreTable stores={stores} />
      <AdminUsersTable users={users} />
    </main>
  );
}

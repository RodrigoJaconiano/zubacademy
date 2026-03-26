import type { AdminCertificate, AdminStoreMetric, AdminUser } from "./types";

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

export function buildCsvContent(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csvContent = buildCsvContent(rows);

  if (!csvContent) return;

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

export function mapUsersToCsvRows(users: AdminUser[]) {
  return users.map((user) => ({
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
    loja_primaria: user.primaryStoreName ?? "",
    lojas_secundarias: user.secondaryStoreNames.join(" | "),
    possui_selecao_loja: user.hasStoreSelection ? "Sim" : "Não",
    quantidade_lojas_selecionadas: user.selectedStoresCount,
    loja_selecionada_em: user.storeSelectedAt ?? "",
    criado_em: user.created_at ?? "",
    atualizado_em: user.updated_at ?? "",
    ultimo_quiz_em: user.lastQuizAt ?? "",
  }));
}

export function mapCertificatesToCsvRows(certificates: AdminCertificate[]) {
  return certificates.map((certificate) => ({
    id: certificate.id,
    user_id: certificate.user_id ?? "",
    certificate_code: certificate.certificate_code ?? "",
    issued_at: certificate.issued_at ?? "",
    course_slug: certificate.course_slug ?? "",
  }));
}

export function mapStoresToCsvRows(stores: AdminStoreMetric[]) {
  return stores.map((store) => ({
    store_id: store.storeId,
    loja: store.storeName,
    ativa: store.active ? "Sim" : "Não",
    vagas: store.vacancies,
    candidaturas_total: store.appliedCount,
    candidaturas_primarias: store.primaryApplications,
    candidaturas_secundarias: store.secondaryApplications,
    usuarios_selecionados: store.selectedUsers,
    perfis_completos: store.completedProfiles,
    curso_concluido: store.completedCourseUsers,
    quiz_aprovado: store.passedQuizUsers,
    certificados: store.certifiedUsers,
  }));
}

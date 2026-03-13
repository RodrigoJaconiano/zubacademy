"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import type { AdminUser } from "./AdminDashboard";

type Props = {
  users: AdminUser[];
};

const PAGE_SIZE = 10;

function formatDate(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("pt-BR");
}

function formatQuizStatus(user: AdminUser) {
  if (user.quizPassed) {
    return user.bestQuizScore !== null
      ? `Aprovado (${user.bestQuizScore}%)`
      : "Aprovado";
  }

  if (user.quizAttempts > 0) {
    return user.bestQuizScore !== null
      ? `Reprovado (${user.bestQuizScore}%)`
      : "Reprovado";
  }

  return "Não realizado";
}

export default function AdminUsersTable({ users }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [page, users]);

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-5">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Usuários</h2>
            <p className="text-sm text-slate-500">
              Página {page} de {totalPages}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-600">Nome</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Email</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">CPF</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Telefone</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Role</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Perfil</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Progresso</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Quiz</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Tentativas</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Certificado</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Cadastro</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-900">{user.name || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.email || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.cpf || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.phone || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.app_role || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.isComplete ? "Completo" : "Incompleto"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.progress}% ({user.completedLessons}/{user.totalLessons})
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatQuizStatus(user)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{user.quizAttempts}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.hasCertificate ? `Sim (${user.certificateCount})` : "Não"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="w-auto"
          >
            Anterior
          </Button>

          <Button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="w-auto"
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  );
}

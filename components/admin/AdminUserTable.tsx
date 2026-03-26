"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import type { AdminUser } from "@/lib/admin/types";

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

function IncompleteProfileBadge({ missingItems }: { missingItems: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (missingItems.length === 0) {
    return <span className="text-emerald-700 font-medium">Completo</span>;
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
        aria-expanded={isOpen}
        aria-label="Ver pendências do perfil"
      >
        <span>Incompleto</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-200 px-1 text-[11px] font-bold text-amber-800">
          {missingItems.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pendências do perfil
          </p>

          <ul className="space-y-1.5">
            {missingItems.map((item) => (
              <li
                key={item}
                className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersTable({ users }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.cpf?.toLowerCase().includes(term);

      const matchesProfile =
        profileFilter === "all" ||
        (profileFilter === "complete" && user.isComplete) ||
        (profileFilter === "incomplete" && !user.isComplete);

      const matchesStore =
        storeFilter === "all" ||
        (storeFilter === "with-store" && user.hasStoreSelection) ||
        (storeFilter === "without-store" && !user.hasStoreSelection);

      return Boolean(matchesSearch && matchesProfile && matchesStore);
    });
  }, [profileFilter, search, storeFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Usuários</h2>
              <p className="text-sm text-slate-500">
                Página {page} de {totalPages}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Buscar usuário
              </label>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Nome, email ou CPF"
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Perfil
              </label>
              <select
                value={profileFilter}
                onChange={(event) => {
                  setProfileFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="all">Todos</option>
                <option value="complete">Completo</option>
                <option value="incomplete">Incompleto</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Unidade
              </label>
              <select
                value={storeFilter}
                onChange={(event) => {
                  setStoreFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="all">Todos</option>
                <option value="with-store">Com unidade</option>
                <option value="without-store">Sem unidade</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-600">Nome</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Email</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">CPF</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Telefone</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Role</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Perfil</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Unidade primária</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Secundárias</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Selecionada em</th>
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
                    <IncompleteProfileBadge missingItems={user.missingItems} />
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.primaryStoreName || "-"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.secondaryStoreNames.length > 0
                      ? user.secondaryStoreNames.join(", ")
                      : "-"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDate(user.storeSelectedAt)}
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
                  <td colSpan={14} className="py-8 text-center text-slate-500">
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

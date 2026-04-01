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

function formatRating(user: AdminUser) {
  if (!user.courseRating) return "Sem nota";
  return `${user.courseRating} ★`;
}

function IncompleteProfileBadge({ missingItems }: { missingItems: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (missingItems.length === 0) {
    return <span className="font-medium text-emerald-700">Completo</span>;
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

function FeedbackCell({
  primaryFeedback,
  secondaryFeedback,
}: {
  primaryFeedback: string | null;
  secondaryFeedback: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hasFeedback = Boolean(
    primaryFeedback?.trim() || secondaryFeedback?.trim()
  );

  if (!hasFeedback) {
    return <span className="text-slate-500">-</span>;
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
        className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
        aria-expanded={isOpen}
        aria-label="Ver feedback"
      >
        Ver feedback
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Feedback principal
              </p>
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {primaryFeedback?.trim() || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Feedback complementar
              </p>
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {secondaryFeedback?.trim() || "-"}
              </p>
            </div>
          </div>
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
  const [ratingFilter, setRatingFilter] = useState("all");

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

      const matchesRating =
        ratingFilter === "all" ||
        (ratingFilter === "without-rating" && !user.courseRating) ||
        (ratingFilter !== "without-rating" &&
          user.courseRating !== null &&
          String(user.courseRating) === ratingFilter);

      return Boolean(
        matchesSearch && matchesProfile && matchesStore && matchesRating
      );
    });
  }, [profileFilter, ratingFilter, search, storeFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safePage]);

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Usuários</h2>
              <p className="text-sm text-slate-500">
                Página {safePage} de {totalPages}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
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

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Nota
              </label>
              <select
                value={ratingFilter}
                onChange={(event) => {
                  setRatingFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="all">Todas</option>
                <option value="without-rating">Sem nota</option>
                <option value="1">1 estrela</option>
                <option value="2">2 estrelas</option>
                <option value="3">3 estrelas</option>
                <option value="4">4 estrelas</option>
                <option value="5">5 estrelas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1900px] border-collapse text-sm">
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
                <th className="py-3 pr-4 font-semibold text-slate-600">Nota</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Feedback</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Data do feedback</th>
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
                    {formatRating(user)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    <FeedbackCell
                      primaryFeedback={user.primaryFeedback}
                      secondaryFeedback={user.secondaryFeedback}
                    />
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDate(user.latestFeedbackAt)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={17} className="py-8 text-center text-slate-500">
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
            disabled={safePage === 1}
            className="w-auto"
          >
            Anterior
          </Button>

          <Button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={safePage === totalPages}
            className="w-auto"
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  );
}

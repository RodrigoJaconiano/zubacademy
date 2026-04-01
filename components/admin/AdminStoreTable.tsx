"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/card";
import type { AdminStoreMetric } from "@/lib/admin/types";

type Props = {
  stores: AdminStoreMetric[];
};

type VacanciesState = Record<string, string>;
type SavingState = Record<string, boolean>;
type MessageState = Record<string, string | null>;

const PAGE_SIZE = 10;

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M5 10.5L8.5 14L15 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminStoreTable({ stores }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [vacanciesByStore, setVacanciesByStore] = useState<VacanciesState>(() =>
    Object.fromEntries(
      stores.map((store) => [store.storeId, String(store.vacancies)])
    )
  );
  const [savingByStore, setSavingByStore] = useState<SavingState>({});
  const [messageByStore, setMessageByStore] = useState<MessageState>({});

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return stores;

    return stores.filter((store) =>
      store.storeName.toLowerCase().includes(term)
    );
  }, [search, stores]);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedStores = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredStores.slice(start, start + PAGE_SIZE);
  }, [filteredStores, safePage]);

  async function handleSaveVacancies(storeId: string) {
    const rawValue = vacanciesByStore[storeId] ?? "";
    const parsedValue = Number(rawValue);

    setMessageByStore((prev) => ({
      ...prev,
      [storeId]: null,
    }));

    if (
      rawValue.trim() === "" ||
      !Number.isFinite(parsedValue) ||
      parsedValue < 0
    ) {
      setMessageByStore((prev) => ({
        ...prev,
        [storeId]: "Informe um número válido.",
      }));
      return;
    }

    try {
      setSavingByStore((prev) => ({
        ...prev,
        [storeId]: true,
      }));

      const response = await fetch("/api/admin/stores/update-vacancies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId,
          vacancies: Math.floor(parsedValue),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Erro ao salvar vagas.");
      }

      setVacanciesByStore((prev) => ({
        ...prev,
        [storeId]: String(Math.floor(parsedValue)),
      }));

      setMessageByStore((prev) => ({
        ...prev,
        [storeId]: "Salvo com sucesso.",
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar vagas.";

      setMessageByStore((prev) => ({
        ...prev,
        [storeId]: message,
      }));
    } finally {
      setSavingByStore((prev) => ({
        ...prev,
        [storeId]: false,
      }));
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Lojas / unidades
            </h2>
            <p className="text-sm text-slate-500">
              Página {safePage} de {totalPages}
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Buscar loja
            </label>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Digite o nome da loja"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-600">Loja</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Ativa</th>
                <th className="py-3 pr-3 font-semibold text-slate-600">Vagas</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Ação</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Candidaturas</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Primárias</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Secundárias</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Selecionados</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Perfis completos</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Curso concluído</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Quiz aprovado</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Certificados</th>
              </tr>
            </thead>

            <tbody>
              {paginatedStores.map((store) => {
                const storeMessage = messageByStore[store.storeId];
                const isSaving = Boolean(savingByStore[store.storeId]);

                return (
                  <tr
                    key={store.storeId}
                    className="border-b border-slate-100 align-middle"
                  >
                    <td className="py-3 pr-4 text-slate-900">{store.storeName}</td>

                    <td className="py-3 pr-4 text-slate-600">
                      {store.active ? "Sim" : "Não"}
                    </td>

                    <td className="py-3 pr-3 text-slate-600">
                      <div className="flex w-[92px] flex-col gap-1">
                        <input
                          type="number"
                          min={0}
                          value={
                            vacanciesByStore[store.storeId] ??
                            String(store.vacancies)
                          }
                          onChange={(event) =>
                            setVacanciesByStore((prev) => ({
                              ...prev,
                              [store.storeId]: event.target.value,
                            }))
                          }
                          className="h-9 w-[92px] rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-400"
                        />

                        {storeMessage ? (
                          <p
                            className={`text-[11px] leading-4 ${
                              storeMessage.toLowerCase().includes("sucesso") ||
                              storeMessage.toLowerCase().includes("salvo")
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {storeMessage}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3 pr-4 text-slate-600">
                      <button
                        type="button"
                        onClick={() => handleSaveVacancies(store.storeId)}
                        disabled={isSaving}
                        aria-label="Salvar vagas"
                        title="Salvar vagas"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? (
                          <span className="text-xs font-semibold">...</span>
                        ) : (
                          <CheckIcon />
                        )}
                      </button>
                    </td>

                    <td className="py-3 pr-4 text-slate-600">{store.appliedCount}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {store.primaryApplications}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {store.secondaryApplications}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{store.selectedUsers}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {store.completedProfiles}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {store.completedCourseUsers}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {store.passedQuizUsers}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{store.certifiedUsers}</td>
                  </tr>
                );
              })}

              {paginatedStores.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={safePage === 1}
            className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Anterior
          </button>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={safePage === totalPages}
            className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Próxima
          </button>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import type { AdminStoreMetric } from "@/lib/admin/types";

type Props = {
  stores: AdminStoreMetric[];
};

const PAGE_SIZE = 10;

export default function AdminStoreTable({ stores }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return stores;

    return stores.filter((store) =>
      store.storeName.toLowerCase().includes(term)
    );
  }, [search, stores]);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));

  const paginatedStores = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStores.slice(start, start + PAGE_SIZE);
  }, [filteredStores, page]);

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Lojas / unidades</h2>
            <p className="text-sm text-slate-500">
              Página {page} de {totalPages}
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
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-600">Loja</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Ativa</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Vagas</th>
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
              {paginatedStores.map((store) => (
                <tr key={store.storeId} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-900">{store.storeName}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {store.active ? "Sim" : "Não"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{store.vacancies}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.appliedCount}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.primaryApplications}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.secondaryApplications}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.selectedUsers}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.completedProfiles}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.completedCourseUsers}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.passedQuizUsers}</td>
                  <td className="py-3 pr-4 text-slate-600">{store.certifiedUsers}</td>
                </tr>
              ))}

              {paginatedStores.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Nenhuma loja encontrada.
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

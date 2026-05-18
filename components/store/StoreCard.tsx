"use client";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { formatDistanceKm } from "@/lib/utils/distance";
import type { NearbyStore } from "@/lib/services/stores";

type StoreCardProps = {
  store: NearbyStore;
  selected?: boolean;
  onToggleSelect: (storeId: string) => void;
};

const TRAINING_AGENDA_URL = "https://agenda-de-treinamento.vercel.app";

function formatVacanciesLabel(vacancies: number) {
  if (vacancies === 1) {
    return "1 vaga disponível";
  }

  return `${vacancies} vagas disponíveis`;
}

function formatApplicationsLabel(appliedCount: number) {
  if (appliedCount === 1) {
    return "1 candidatura";
  }

  return `${appliedCount} candidaturas`;
}

export default function StoreCard({
  store,
  selected = false,
  onToggleSelect,
}: StoreCardProps) {
  return (
    <Card
      className={`rounded-[24px] p-5 transition ${
        selected ? "border-blue-300 bg-blue-50/40" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-slate-900">{store.name}</p>

              {store.brandName ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {store.brandName}
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-slate-600">
              {store.distanceKm !== null
                ? `Distância aproximada: ${formatDistanceKm(store.distanceKm)}`
                : "Distância não disponível"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {formatVacanciesLabel(store.vacancies)}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {formatApplicationsLabel(store.appliedCount)}
            </span>

            {store.hasActiveOnlineCourse ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Treinamento online disponível
              </span>
            ) : (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                Online indisponível
              </span>
            )}
          </div>

          {!store.hasActiveOnlineCourse ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-800">
                Loja indisponível para treinamento online
              </p>

              <p className="mt-1 text-sm leading-6 text-red-900">
                O treinamento online para esta loja ainda não está disponível na
                Zubacademy. Você ainda pode selecionar a loja e realizar o
                treinamento presencial pela agenda.
              </p>

              <a
                href={TRAINING_AGENDA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-red-700"
              >
                Acessar agenda presencial
              </a>
            </div>
          ) : null}
        </div>

        <div className="lg:min-w-[200px]">
          <Button
            type="button"
            onClick={() => onToggleSelect(store.id)}
            disabled={store.vacancies <= 0}
          >
            {selected ? "Remover seleção" : "Selecionar loja"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

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
    <Card className="rounded-[24px] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div>
            <p className="text-lg font-bold text-slate-900">{store.name}</p>
            <p className="text-sm text-slate-600">
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
          </div>
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

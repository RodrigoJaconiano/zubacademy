"use client";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { formatDistanceKm } from "@/lib/utils/distance";
import type { NearbyStore } from "@/lib/services/stores";

type StoreCardProps = {
  store: NearbyStore;
  selecting?: boolean;
  onSelect: (storeId: string) => void;
};

export default function StoreCard({
  store,
  selecting = false,
  onSelect,
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
              {store.vacancies} vaga{store.vacancies === 1 ? "" : "s"} disponível
              {store.vacancies === 1 ? "" : "eis"}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {store.appliedCount} aplicação{store.appliedCount === 1 ? "" : "ões"}
            </span>
          </div>
        </div>

        <div className="lg:min-w-[180px]">
          <Button
            type="button"
            onClick={() => onSelect(store.id)}
            disabled={selecting || store.vacancies <= 0}
          >
            {selecting ? "Selecionando..." : "Selecionar loja"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

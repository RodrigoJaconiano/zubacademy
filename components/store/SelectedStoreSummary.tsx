"use client";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { formatDistanceKm } from "@/lib/utils/distance";
import type { NearbyStore } from "@/lib/services/stores";

type SelectedStoreSummaryProps = {
  stores: NearbyStore[];
  primaryStore: NearbyStore | null;
  onConfirm: () => void;
  loading?: boolean;
};

export default function SelectedStoreSummary({
  stores,
  primaryStore,
  onConfirm,
  loading = false,
}: SelectedStoreSummaryProps) {
  if (!stores.length) {
    return (
      <Card className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Nenhuma loja selecionada
          </p>
          <p className="text-sm text-slate-600">
            Selecione uma ou mais lojas para continuar. A loja principal será
            definida automaticamente como a mais próxima entre as selecionadas.
          </p>
        </div>
      </Card>
    );
  }

  const secondaryStores = stores.filter((store) => store.id !== primaryStore?.id);

  return (
    <Card className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-5">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-700">
            Resumo da seleção
          </p>

          <h3 className="text-xl font-bold text-slate-900">
            {stores.length === 1
              ? "1 loja selecionada"
              : `${stores.length} lojas selecionadas`}
          </h3>

          <p className="text-sm text-slate-600">
            A loja principal será vinculada ao seu cadastro e definida pela menor
            distância em relação à região pesquisada.
          </p>
        </div>

        {primaryStore ? (
          <div className="rounded-2xl border border-blue-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Loja principal
            </p>
            <h4 className="mt-1 text-lg font-bold text-slate-900">
              {primaryStore.name}
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              {primaryStore.distanceKm !== null
                ? `Distância aproximada: ${formatDistanceKm(primaryStore.distanceKm)}`
                : "Distância não disponível"}
            </p>
          </div>
        ) : null}

        {secondaryStores.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Lojas secundárias
            </p>

            <div className="space-y-2">
              {secondaryStores.map((store) => (
                <div
                  key={store.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-semibold text-slate-900">{store.name}</p>
                  <p className="text-sm text-slate-600">
                    {store.distanceKm !== null
                      ? `Distância aproximada: ${formatDistanceKm(store.distanceKm)}`
                      : "Distância não disponível"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? "Salvando seleção..." : "Confirmar seleção"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

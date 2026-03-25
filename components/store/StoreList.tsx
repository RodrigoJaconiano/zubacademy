"use client";

import type { NearbyStore } from "@/lib/services/stores";
import StoreCard from "@/components/store/StoreCard";

type StoreListProps = {
  stores: NearbyStore[];
  loading?: boolean;
  selectedStoreIds: string[];
  onToggleSelect: (storeId: string) => void;
};

export default function StoreList({
  stores,
  loading = false,
  selectedStoreIds,
  onToggleSelect,
}: StoreListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Buscando lojas próximas...
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        Nenhuma loja com vagas disponíveis foi encontrada para essa região.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          selected={selectedStoreIds.includes(store.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

"use client";

import Card from "@/components/ui/card";

type SelectedStoreSummaryProps = {
  storeName: string;
  selectedAt?: string | null;
};

export default function SelectedStoreSummary({
  storeName,
  selectedAt,
}: SelectedStoreSummaryProps) {
  return (
    <Card className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-700">Loja selecionada</p>
        <h3 className="text-xl font-bold text-slate-900">{storeName}</h3>

        {selectedAt ? (
          <p className="text-sm text-slate-600">
            Selecionada em{" "}
            {new Date(selectedAt).toLocaleString("pt-BR")}
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Esta unidade foi vinculada ao seu cadastro.
          </p>
        )}
      </div>
    </Card>
  );
}

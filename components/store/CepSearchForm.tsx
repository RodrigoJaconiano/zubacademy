"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import { formatCep } from "@/lib/services/stores";

type CepSearchFormProps = {
  cep: string;
  onCepChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function CepSearchForm({
  cep,
  onCepChange,
  onSubmit,
  loading = false,
}: CepSearchFormProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Buscar por CEP
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Digite seu CEP para encontrarmos a loja mais próxima.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={formatCep(cep)}
            onChange={(event) => onCepChange(event.target.value)}
            placeholder="Digite seu CEP"
            inputMode="numeric"
            maxLength={9}
          />

          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading || cep.replace(/\D/g, "").length !== 8}
          >
            {loading ? "Buscando..." : "Buscar lojas"}
          </Button>
        </div>
      </div>
    </div>
  );
}

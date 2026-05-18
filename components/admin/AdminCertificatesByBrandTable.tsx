import Card from "@/components/ui/card";
import type { AdminCertificateByBrand } from "@/lib/admin/types";

type Props = {
  certificatesByBrand: AdminCertificateByBrand[];
};

export default function AdminCertificatesByBrandTable({
  certificatesByBrand,
}: Props) {
  const totalCertificates = certificatesByBrand.reduce(
    (total, item) => total + item.total,
    0
  );

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Certificados por marca
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Distribuição dos certificados emitidos por treinamento/marca.
          </p>
        </div>

        {certificatesByBrand.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">
              Nenhum certificado emitido ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3 text-right">Certificados</th>
                  <th className="px-4 py-3 text-right">Participação</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {certificatesByBrand.map((item) => {
                  const percentage =
                    totalCertificates > 0
                      ? Math.round((item.total / totalCertificates) * 100)
                      : 0;

                  return (
                    <tr key={item.brandSlug}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.brandName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.brandSlug}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {item.total}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-600">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

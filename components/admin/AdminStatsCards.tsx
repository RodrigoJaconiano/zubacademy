import Card from "@/components/ui/card";
import type { AdminSummary } from "@/lib/admin/types";

type Props = {
  summary: AdminSummary;
};

export default function AdminStatsCards({ summary }: Props) {
  const items = [
    { label: "Total de usuários", value: summary.totalUsers },
    { label: "Perfis completos", value: summary.completedProfiles },
    { label: "Progresso médio", value: `${summary.averageProgress}%` },
    { label: "Aprovados no quiz", value: summary.approvedUsers },
    { label: "Certificados emitidos", value: summary.certificatesIssued },
    { label: "Usuários certificados", value: summary.uniqueCertifiedUsers },

    // 🔥 NOVO CARD (NPS)
    {
      label: "NPS",
      value:
        summary.averageCourseRating > 0
          ? summary.averageCourseRating.toFixed(1)
          : null,
      isRating: true,
    },

    { label: "Com unidade selecionada", value: summary.usersWithStoreSelection },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-2xl border-slate-200">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">
              {item.label}
            </p>

            {item.isRating ? (
              item.value ? (
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                  <span className="text-2xl text-blue-600">★</span>
                </div>
              ) : (
                <p className="text-base font-semibold text-slate-900">
                  Sem avaliações
                </p>
              )
            ) : (
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {item.value}
              </p>
            )}
          </div>
        </Card>
      ))}
    </section>
  );
}

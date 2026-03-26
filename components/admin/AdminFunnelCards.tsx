import Card from "@/components/ui/card";
import type { AdminFunnel } from "@/lib/admin/types";

type Props = {
  funnel: AdminFunnel;
};

export default function AdminFunnelCards({ funnel }: Props) {
  const items = [
    { label: "Cadastrados", value: funnel.registered },
    { label: "Selecionaram unidade", value: funnel.selectedStore },
    { label: "Perfil completo", value: funnel.completedProfile },
    { label: "Curso concluído", value: funnel.completedCourse },
    { label: "Quiz aprovado", value: funnel.passedQuiz },
    { label: "Certificado emitido", value: funnel.receivedCertificate },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Funil</h2>
        <p className="text-sm text-slate-500">
          Acompanhamento da jornada do usuário até a certificação.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {items.map((item) => (
          <Card key={item.label} className="rounded-2xl border-slate-200">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {item.value}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

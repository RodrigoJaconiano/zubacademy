import Card from "@/components/ui/card";

type Profile = {
  id: string;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  progress?: number | null;
};

type Certificate = {
  id: string;
  user_id?: string | null;
};

type Props = {
  profiles: Profile[];
  certificates: Certificate[];
};

export default function AdminStatsCards({ profiles, certificates }: Props) {
  const totalUsers = profiles.length;

  const completedProfiles = profiles.filter((profile) => {
    return Boolean(profile.name && profile.cpf && profile.phone);
  }).length;

  const averageProgress =
    totalUsers > 0
      ? Math.round(
          profiles.reduce((acc, profile) => acc + (profile.progress ?? 0), 0) /
            totalUsers
        )
      : 0;

  const uniqueCertifiedUsers = new Set(
    certificates.map((certificate) => certificate.user_id).filter(Boolean)
  ).size;

  const items = [
    { label: "Total de usuários", value: totalUsers },
    { label: "Perfis completos", value: completedProfiles },
    { label: "Progresso médio", value: `${averageProgress}%` },
    { label: "Certificados emitidos", value: certificates.length },
    { label: "Usuários certificados", value: uniqueCertifiedUsers },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
    </section>
  );
}

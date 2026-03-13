import Card from "@/components/ui/card";
import type { AdminCertificate, AdminUser } from "./AdminDashboard";

type Props = {
  users: AdminUser[];
  certificates: AdminCertificate[];
};

export default function AdminStatsCards({ users, certificates }: Props) {
  const totalUsers = users.length;

  const completedProfiles = users.filter((user) => user.isComplete).length;

  const averageProgress =
    totalUsers > 0
      ? Math.round(
          users.reduce((acc, user) => acc + user.progress, 0) / totalUsers
        )
      : 0;

  const approvedUsers = users.filter((user) => user.quizPassed).length;

  const uniqueCertifiedUsers = new Set(
    certificates.map((certificate) => certificate.user_id).filter(Boolean)
  ).size;

  const adminUsers = users.filter((user) => {
    return user.app_role?.toLowerCase() === "admin";
  }).length;

  const items = [
    { label: "Total de usuários", value: totalUsers },
    { label: "Perfis completos", value: completedProfiles },
    { label: "Progresso médio", value: `${averageProgress}%` },
    { label: "Aprovados no quiz", value: approvedUsers },
    { label: "Certificados emitidos", value: certificates.length },
    { label: "Usuários certificados", value: uniqueCertifiedUsers },
    { label: "Admins por role", value: adminUsers },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
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

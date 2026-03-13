"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";

type Profile = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  created_at?: string | null;
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

const PAGE_SIZE = 10;

export default function AdminUsersTable({ profiles, certificates }: Props) {
  const [page, setPage] = useState(1);

  const certifiedUsers = useMemo(() => {
    return new Set(
      certificates.map((certificate) => certificate.user_id).filter(Boolean)
    );
  }, [certificates]);

  const users = useMemo(() => {
    return profiles.map((profile) => ({
      ...profile,
      hasCertificate: certifiedUsers.has(profile.user_id ?? null),
      isComplete: Boolean(profile.name && profile.cpf && profile.phone),
    }));
  }, [profiles, certifiedUsers]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [page, users]);

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="space-y-5">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Usuários</h2>
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-600">Nome</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Email</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">CPF</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Telefone</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Perfil completo</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Progresso</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Certificado</th>
                <th className="py-3 pr-4 font-semibold text-slate-600">Cadastro</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-900">{user.name || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.email || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.cpf || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.phone || "-"}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.isComplete ? "Sim" : "Não"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.progress ?? 0}%
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.hasCertificate ? "Sim" : "Não"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>

          <Button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  );
}

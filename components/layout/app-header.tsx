import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/layout/app-nav";
import { createClient } from "@/lib/supabase/server";
import { isZubaleAdmin } from "@/lib/utils/auth";

type AppHeaderProps = {
  userName?: string | null;
};

export default async function AppHeader({ userName }: AppHeaderProps) {
  const normalizedUserName = userName?.trim();
  const hasUserName =
    Boolean(normalizedUserName) && normalizedUserName !== "Aluno(a)";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let appRole: string | null = null;

  if (user?.id) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao carregar app_role no header:", profileError.message);
    }

    appRole = profile?.app_role ?? null;
  }

  const admin = isZubaleAdmin({
    email: user?.email,
    appRole,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          aria-label="Ir para o dashboard da Zubacademy"
          className="group relative inline-flex items-center gap-3 rounded-2xl px-1 py-1 transition duration-200 hover:opacity-95 active:scale-95"
        >
          <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-active:opacity-100">
            <span className="absolute inset-0 rounded-2xl bg-blue-100/70 animate-pulse" />
          </span>

          <div className="relative z-10 h-12 w-12 overflow-hidden rounded-2xl bg-blue-600 shadow-sm transition duration-200 group-hover:shadow-md">
            <Image
              src="/images/zubacademyico.png"
              alt="Logo da Zubacademy"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="relative z-10 hidden min-w-0 sm:block">
            <p className="truncate text-base font-bold tracking-tight !text-slate-900">
              Zubacademy
            </p>
            <p className="truncate text-xs !text-slate-500">
              Plataforma de treinamento oficial da Zubale
            </p>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3">
          <AppNav isAdmin={admin} />

          {hasUserName && (
            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right sm:block">
              <p className="text-[11px] uppercase tracking-wide !text-slate-500">
                Bem-vindo(a)
              </p>
              <p className="max-w-[180px] truncate text-sm font-semibold !text-slate-900">
                {normalizedUserName}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

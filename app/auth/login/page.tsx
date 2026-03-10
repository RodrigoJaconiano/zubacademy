"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import PageContainer from "@/components/ui/page-container";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import Card from "@/components/ui/card";
import TextMessage from "@/components/ui/text-message";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"default" | "success" | "error">("default");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erro ao verificar sessão:", userError);
        setCheckingSession(false);
        return;
      }

      if (!user) {
        setCheckingSession(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, phone, cep, city, state, address, number")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erro ao buscar perfil no login:", profileError);
        setCheckingSession(false);
        return;
      }

      const profileIncomplete =
        !profile?.name ||
        !profile?.phone ||
        !profile?.cep ||
        !profile?.city ||
        !profile?.state ||
        !profile?.address ||
        !profile?.number;

      router.replace(profileIncomplete ? "/perfil" : "/dashboard");
    }

    checkSession();
  }, [router, supabase]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://zubacademy.vercel.app/auth/callback?next=/perfil",
      },
    });

    if (error) {
      setStatus("error");
      setMessage(`Erro: ${error.message}`);
      console.error(error);
      setLoading(false);
      return;
    }

    setStatus("success");
    setMessage("Verifique seu e-mail para entrar.");
    setLoading(false);
  }

  if (checkingSession) {
    return (
      <PageContainer className="flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md">
          <Card className="rounded-[28px] p-8">
            <p className="text-sm text-slate-600">Verificando acesso...</p>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-md">
        <Card className="rounded-[28px] p-8">
          <div className="mb-6">
            <div className="mb-4 inline-flex rounded-2xl bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Zubale Academy
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Entrar
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Digite seu e-mail para receber um link seguro de acesso à plataforma.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" disabled={loading || !email}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </form>

          {message && <TextMessage variant={status}>{message}</TextMessage>}
        </Card>
      </div>
    </PageContainer>
  );
}

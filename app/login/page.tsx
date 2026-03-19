"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import PageContainer from "@/components/ui/page-container";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import Card from "@/components/ui/card";
import TextMessage from "@/components/ui/text-message";

type Step = "email" | "otp";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"default" | "success" | "error">("default");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingSession(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, phone, cep, city, state, address, number")
        .eq("id", user.id)
        .maybeSingle();

      const incomplete =
        !profile?.name ||
        !profile?.phone ||
        !profile?.cep ||
        !profile?.city ||
        !profile?.state ||
        !profile?.address ||
        !profile?.number;

      router.replace(incomplete ? "/perfil" : "/dashboard");
    }

    checkSession();
  }, [router, supabase]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setStatus("success");
    setMessage("Enviamos um código de 6 dígitos para seu e-mail.");
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setStatus("error");
      setMessage("Código inválido ou expirado.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  if (checkingSession) {
    return (
      <PageContainer className="flex min-h-screen items-center justify-center py-16">
        <Card className="p-8">Verificando acesso...</Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-md">
        <Card className="p-8 space-y-6">
          <h1 className="text-2xl font-bold">Entrar</h1>

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" disabled={!email || loading}>
                {loading ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                placeholder="Digite o código de 6 dígitos"
                value={token}
                onChange={(e) =>
                  setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />

              <Button type="submit" disabled={token.length !== 6 || loading}>
                {loading ? "Validando..." : "Entrar"}
              </Button>

              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={() => setStep("email")}
              >
                Voltar
              </button>
            </form>
          )}

          {message && <TextMessage variant={status}>{message}</TextMessage>}
        </Card>
      </div>
    </PageContainer>
  );
}

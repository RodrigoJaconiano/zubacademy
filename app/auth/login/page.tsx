"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

import PageContainer from "@/components/ui/page-container";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import Card from "@/components/ui/card";
import TextMessage from "@/components/ui/text-message";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"default" | "success" | "error">("default");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://zubacademy.vercel.app/auth/callback?next=/dashboard",
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
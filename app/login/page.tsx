"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

import PageContainer from "@/components/ui/page-container";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import Card from "@/components/ui/card";
import TextMessage from "@/components/ui/text-message";

type Step = "email" | "otp";
type MessageStatus = "default" | "success" | "error";

type RawProfileRow = {
  name?: string | null;
  phone?: string | null;
  cpf?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | number | null;
  terms_accepted?: boolean | null;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<MessageStatus>("default");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otpValues = Array.from({ length: 6 }, (_, index) => token[index] ?? "");

  async function redirectAuthenticatedUser() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCheckingSession(false);
      return;
    }

    const { data: rawProfile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted"
      )
      .eq("id", user.id)
      .maybeSingle<RawProfileRow>();

    if (profileError) {
      console.error("Erro ao buscar perfil no login:", profileError);
      setCheckingSession(false);
      router.replace("/dashboard");
      return;
    }

    const profile: ProfileData | null = rawProfile
      ? {
          name: rawProfile.name ?? null,
          phone: rawProfile.phone ?? null,
          cpf: rawProfile.cpf ?? null,
          cep: rawProfile.cep ?? null,
          city: rawProfile.city ?? null,
          state: rawProfile.state ?? null,
          address: rawProfile.address ?? null,
          number:
            rawProfile.number === null || rawProfile.number === undefined
              ? null
              : String(rawProfile.number),
        }
      : null;

    const missingProfileFields = getMissingProfileFields(profile);
    const profileIncomplete = missingProfileFields.length > 0;
    const termsAccepted = Boolean(rawProfile?.terms_accepted);

    setCheckingSession(false);
    router.replace(profileIncomplete || !termsAccepted ? "/perfil" : "/dashboard");
  }

  async function waitForSession(maxAttempts = 12, delayMs = 250) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        return session;
      }

      await sleep(delayMs);
    }

    return null;
  }

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session?.user) {
        setCheckingSession(false);
        return;
      }

      await redirectAuthenticatedUser();
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION"
      ) {
        if (session?.user) {
          router.refresh();
          void redirectAuthenticatedUser();
        } else {
          setCheckingSession(false);
        }
      }

      if (event === "SIGNED_OUT") {
        setCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    if (step === "otp") {
      const timer = window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);

      return () => window.clearTimeout(timer);
    }
  }, [step]);

  function focusOtpIndex(index: number) {
    otpRefs.current[index]?.focus();
  }

  function handleOtpChange(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      const nextValues = [...otpValues];
      nextValues[index] = "";
      setToken(nextValues.join(""));
      return;
    }

    if (digits.length > 1) {
      const pastedDigits = digits.slice(0, 6).split("");
      const nextValues = [...otpValues];

      for (let i = 0; i < 6; i += 1) {
        nextValues[i] = pastedDigits[i] ?? "";
      }

      const nextToken = nextValues.join("").slice(0, 6);
      setToken(nextToken);

      const nextFocusIndex = Math.min(nextToken.length, 5);
      focusOtpIndex(nextFocusIndex);
      return;
    }

    const nextValues = [...otpValues];
    nextValues[index] = digits;
    const nextToken = nextValues.join("").slice(0, 6);

    setToken(nextToken);

    if (index < 5) {
      focusOtpIndex(index + 1);
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace") {
      if (otpValues[index]) {
        const nextValues = [...otpValues];
        nextValues[index] = "";
        setToken(nextValues.join(""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        focusOtpIndex(index - 1);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusOtpIndex(index - 1);
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      focusOtpIndex(index + 1);
    }
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    setToken(pasted);

    const nextFocusIndex = Math.min(pasted.length, 5);
    focusOtpIndex(nextFocusIndex);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setStatus("default");

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setEmail(normalizedEmail);
    setToken("");
    setStatus("success");
    setMessage("Enviamos um código de 6 dígitos para seu e-mail.");
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();

    if (token.length !== 6) {
      setStatus("error");
      setMessage("Digite os 6 dígitos do código.");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("default");

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

    const session = await waitForSession();

    if (!session?.user) {
      setStatus("error");
      setMessage(
        "O código foi validado, mas a sessão não ficou pronta a tempo. Atualize a página e tente novamente."
      );
      setLoading(false);
      return;
    }

    setStatus("success");
    setMessage("Código validado com sucesso. Redirecionando...");

    await redirectAuthenticatedUser();

    setLoading(false);
  }

  function handleBackToEmail() {
    if (loading) return;

    setStep("email");
    setToken("");
    setMessage("");
    setStatus("default");
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
        <Card className="space-y-6 p-8">
          <h1 className="text-2xl font-bold">Entrar</h1>

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" disabled={!email.trim() || loading}>
                {loading ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Digite o código enviado para <strong>{email}</strong>
                </p>

                <div className="flex items-center justify-between gap-2">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="h-14 w-12 rounded-2xl border border-slate-300 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      aria-label={`Dígito ${index + 1} do código`}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={token.length !== 6 || loading}>
                {loading ? "Validando..." : "Entrar"}
              </Button>

              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={handleBackToEmail}
                disabled={loading}
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

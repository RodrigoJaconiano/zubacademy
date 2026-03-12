"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import TextMessage from "@/components/ui/text-message";
import { createClient } from "@/lib/supabase/client";
import { fetchAddressByCep } from "@/lib/services/cep";
import TermsModal from "@/components/profile/terms-modal";

type ProfileFormProps = {
  userId: string;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialCep: string;
  initialCity: string;
  initialState: string;
  initialAddress: string;
  initialNumber: string;
  initialTermsAccepted: boolean;
  initialTermsAcceptedAt: string;
};

const TERMS_VERSION = "v1";

export default function ProfileForm({
  userId,
  initialName,
  initialPhone,
  initialEmail,
  initialCep,
  initialCity,
  initialState,
  initialAddress,
  initialNumber,
  initialTermsAccepted,
  initialTermsAcceptedAt,
}: ProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [cep, setCep] = useState(initialCep);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [address, setAddress] = useState(initialAddress);
  const [number, setNumber] = useState(initialNumber);

  const [termsAccepted, setTermsAccepted] = useState(initialTermsAccepted);
  const [termsAcceptedAt] = useState(initialTermsAcceptedAt);
  const [hasOpenedTerms, setHasOpenedTerms] = useState(initialTermsAccepted);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] = useState<
    "default" | "success" | "error"
  >("default");

  useEffect(() => {
    if (!initialTermsAccepted) {
      setIsTermsModalOpen(true);
    }
  }, [initialTermsAccepted]);

  const isFormReady = useMemo(() => {
    return Boolean(
      name.trim() &&
        phone.trim() &&
        email.trim() &&
        normalizeCep(cep).length === 8 &&
        city.trim() &&
        state.trim() &&
        address.trim() &&
        number.trim() &&
        termsAccepted
    );
  }, [name, phone, email, cep, city, state, address, number, termsAccepted]);

  function normalizeCep(value: string) {
    return value.replace(/\D/g, "").slice(0, 8);
  }

  function formatCep(value: string) {
    const numeric = normalizeCep(value);
    if (numeric.length <= 5) return numeric;
    return `${numeric.slice(0, 5)}-${numeric.slice(5)}`;
  }

  async function handleCepLookup(rawCep: string) {
    const cleanCep = normalizeCep(rawCep);

    if (cleanCep.length !== 8) {
      return;
    }

    try {
      setIsFetchingCep(true);

      const data = await fetchAddressByCep(cleanCep);

      setCep(normalizeCep(data.cep ?? cleanCep));
      setAddress(data.logradouro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");

      setMessage("");
      setMessageVariant("default");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar o CEP."
      );
    } finally {
      setIsFetchingCep(false);
    }
  }

  async function handleCepChange(event: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value;
    const cleanCep = normalizeCep(rawValue);

    setCep(cleanCep);

    if (messageVariant === "error") {
      setMessage("");
      setMessageVariant("default");
    }

    if (cleanCep.length === 8) {
      await handleCepLookup(cleanCep);
    }
  }

  async function handleCepBlur() {
    await handleCepLookup(cep);
  }

  function handleOpenTerms() {
    setHasOpenedTerms(true);
    setIsTermsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    if (!name.trim() || !phone.trim() || !normalizeCep(cep) || !city.trim() || !state.trim()) {
      setMessageVariant("error");
      setMessage("Preencha todos os campos obrigatórios.");
      setIsSaving(false);
      return;
    }

    if (!address.trim()) {
      setMessageVariant("error");
      setMessage("O campo Endereço é obrigatório.");
      setIsSaving(false);
      return;
    }

    if (!number.trim()) {
      setMessageVariant("error");
      setMessage("O campo Número é obrigatório.");
      setIsSaving(false);
      return;
    }

    if (!termsAccepted) {
      setMessageVariant("error");
      setMessage("Você precisa aceitar os termos para continuar.");
      setIsSaving(false);
      return;
    }

    const payload = {
      id: userId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      cep: normalizeCep(cep),
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      number: number.trim(),
      terms_accepted: true,
      terms_accepted_at: termsAcceptedAt || new Date().toISOString(),
      terms_version: TERMS_VERSION,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    if (error) {
      console.error("Erro ao salvar perfil:", error);
      setMessageVariant("error");
      setMessage("Não foi possível salvar seu perfil.");
      setIsSaving(false);
      return;
    }

    setMessageVariant("success");
    setMessage("Perfil atualizado com sucesso.");
    setIsSaving(false);

    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <>
      <Card className="rounded-[28px] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nome completo
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Telefone{" "}
              <span className="text-red-500">
                <strong>(Mesmo do cadastro no APP)</strong>
              </span>
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite seu telefone"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              E-mail{" "}
              <span className="text-red-500">
                <strong>(Mesmo do cadastro no APP)</strong>
              </span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite seu e-mail"
            />
          </div>

          <div>
            <label
              htmlFor="cep"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              CEP
            </label>
            <input
              id="cep"
              value={formatCep(cep)}
              onChange={handleCepChange}
              onBlur={handleCepBlur}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite seu CEP"
            />
            {isFetchingCep ? (
              <p className="mt-2 text-xs text-slate-500">
                Buscando endereço pelo CEP...
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Cidade
            </label>
            <input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite sua cidade"
            />
          </div>

          <div>
            <label
              htmlFor="state"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Estado
            </label>
            <input
              id="state"
              value={state}
              onChange={(event) => setState(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite seu estado"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_180px]">
            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Endereço
              </label>
              <input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Digite seu endereço"
              />
            </div>

            <div>
              <label
                htmlFor="number"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Número *
              </label>
              <input
                id="number"
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex: 123"
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-900">
                Aceite dos termos de utilização
              </p>

              <button
                type="button"
                onClick={handleOpenTerms}
                className="inline-flex w-fit items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Ler termos de utilização
              </button>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={termsAccepted}
                  disabled={!hasOpenedTerms}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  Li e concordo com os termos de utilização da plataforma.
                </span>
              </label>

              {!hasOpenedTerms && !termsAccepted ? (
                <p className="text-xs text-amber-700">
                  Você precisa abrir e ler os termos antes de marcar o aceite.
                </p>
              ) : null}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isSaving || isFetchingCep || !isFormReady}>
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>

          {message ? (
            <TextMessage variant={messageVariant}>{message}</TextMessage>
          ) : null}
        </form>
      </Card>

      <TermsModal
        open={isTermsModalOpen}
        onClose={() => {
          setHasOpenedTerms(true);
          setIsTermsModalOpen(false);
        }}
      />
    </>
  );
}

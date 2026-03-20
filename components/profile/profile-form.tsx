"use client";

import { useEffect, useState } from "react";
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
  initialCpf: string;
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
  initialCpf,
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
  const [email] = useState(initialEmail);
  const [cpf, setCpf] = useState(initialCpf);
  const [cep, setCep] = useState(initialCep);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [address, setAddress] = useState(initialAddress);
  const [number, setNumber] = useState(initialNumber);

  const [termsAccepted, setTermsAccepted] = useState(initialTermsAccepted);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(initialTermsAcceptedAt);
  const [hasOpenedTerms, setHasOpenedTerms] = useState(initialTermsAccepted);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);

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

  function normalizeCpf(value: string) {
    return value.replace(/\D/g, "").slice(0, 11);
  }

  function formatCpf(value: string) {
    const numeric = normalizeCpf(value);

    if (numeric.length <= 3) return numeric;
    if (numeric.length <= 6) {
      return `${numeric.slice(0, 3)}.${numeric.slice(3)}`;
    }
    if (numeric.length <= 9) {
      return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6)}`;
    }

    return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(
      6,
      9
    )}-${numeric.slice(9, 11)}`;
  }

  function normalizeCep(value: string) {
    return value.replace(/\D/g, "").slice(0, 8);
  }

  function formatCep(value: string) {
    const numeric = normalizeCep(value);
    if (numeric.length <= 5) return numeric;
    return `${numeric.slice(0, 5)}-${numeric.slice(5)}`;
  }

  function clearErrorMessage() {
    if (messageVariant === "error") {
      setMessage("");
      setMessageVariant("default");
    }
  }

  function validateForm() {
    if (!name.trim()) {
      return "Preencha o campo Nome completo corretamente.";
    }

    if (!phone.trim()) {
      return "Preencha o campo Telefone corretamente.";
    }

    if (!email.trim()) {
      return "Não foi possível identificar o e-mail da conta.";
    }

    if (normalizeCpf(cpf).length !== 11) {
      return "Preencha o campo CPF corretamente.";
    }

    if (normalizeCep(cep).length !== 8) {
      return "Preencha o campo CEP corretamente.";
    }

    if (!city.trim()) {
      return "Preencha o campo Cidade corretamente.";
    }

    if (!state.trim()) {
      return "Preencha o campo Estado corretamente.";
    }

    if (!address.trim()) {
      return "Preencha o campo Endereço corretamente.";
    }

    if (!number.trim()) {
      return "Preencha o campo Número corretamente.";
    }

    if (!hasOpenedTerms) {
      return "Leia os termos de utilização antes de continuar.";
    }

    if (!termsAccepted) {
      return "Você precisa aceitar os termos para continuar.";
    }

    return null;
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

      clearErrorMessage();
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
    clearErrorMessage();

    if (cleanCep.length === 8) {
      await handleCepLookup(cleanCep);
    }
  }

  async function handleCepBlur() {
    await handleCepLookup(cep);
  }

  function handleOpenTerms() {
    setIsTermsModalOpen(true);
    clearErrorMessage();
  }

  async function handleAcceptTerms() {
    setIsAcceptingTerms(true);
    setMessage("");
    setMessageVariant("default");

    try {
      const acceptedAt = new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted: true,
          terms_accepted_at: acceptedAt,
          terms_version: TERMS_VERSION,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        throw new Error("Não foi possível registrar o aceite dos termos.");
      }

      setTermsAccepted(true);
      setTermsAcceptedAt(acceptedAt);
      setHasOpenedTerms(true);
      setIsTermsModalOpen(false);
      setMessageVariant("success");
      setMessage("Termos aceitos com sucesso.");
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o aceite dos termos."
      );
    } finally {
      setIsAcceptingTerms(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setMessageVariant("default");

    const validationError = validateForm();

    if (validationError) {
      setMessageVariant("error");
      setMessage(validationError);
      setIsSaving(false);
      return;
    }

    const payload = {
      id: userId,
      name: name.trim(),
      phone: phone.trim(),
      cpf: normalizeCpf(cpf),
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
              onChange={(event) => {
                setName(event.target.value);
                clearErrorMessage();
              }}
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
              onChange={(event) => {
                setPhone(event.target.value);
                clearErrorMessage();
              }}
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
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
              placeholder="E-mail cadastrado"
            />
            <p className="mt-2 text-xs text-slate-500">
              O e-mail da conta não pode ser alterado.
            </p>
          </div>

          <div>
            <label
              htmlFor="cpf"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              CPF
            </label>
            <input
              id="cpf"
              value={formatCpf(cpf)}
              onChange={(event) => {
                setCpf(normalizeCpf(event.target.value));
                clearErrorMessage();
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite seu CPF"
              inputMode="numeric"
              maxLength={14}
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
              inputMode="numeric"
              maxLength={9}
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
              onChange={(event) => {
                setCity(event.target.value);
                clearErrorMessage();
              }}
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
              onChange={(event) => {
                setState(event.target.value);
                clearErrorMessage();
              }}
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
                onChange={(event) => {
                  setAddress(event.target.value);
                  clearErrorMessage();
                }}
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
                onChange={(event) => {
                  setNumber(event.target.value);
                  clearErrorMessage();
                }}
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
                {termsAccepted ? "Revisar termos de utilização" : "Ler termos de utilização"}
              </button>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={termsAccepted}
                  readOnly
                  disabled
                />
                <span>
                  {termsAccepted
                    ? "Termos aceitos com sucesso."
                    : "O aceite será liberado ao final da leitura completa dos termos."}
                </span>
              </label>

              {!termsAccepted ? (
                <p className="text-xs text-amber-700">
                  Você precisa rolar até o final do modal e clicar em aceitar para continuar.
                </p>
              ) : null}

              {termsAcceptedAt ? (
                <p className="text-xs text-slate-500">
                  Aceite registrado em:{" "}
                  {new Date(termsAcceptedAt).toLocaleString("pt-BR")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving || isFetchingCep || isAcceptingTerms}
            >
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
        loading={isAcceptingTerms}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={handleAcceptTerms}
      />
    </>
  );
}

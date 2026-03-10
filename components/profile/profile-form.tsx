"use client";

import { useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import TextMessage from "@/components/ui/text-message";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
};

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

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] = useState<
    "default" | "success" | "error"
  >("default");

  function normalizeCep(value: string) {
    return value.replace(/\D/g, "").slice(0, 8);
  }

  function formatCep(value: string) {
    const numeric = normalizeCep(value);
    if (numeric.length <= 5) return numeric;
    return `${numeric.slice(0, 5)}-${numeric.slice(5)}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    if (!number.trim()) {
      setMessageVariant("error");
      setMessage("O campo Número é obrigatório.");
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
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    if (error) {
      setMessageVariant("error");
      setMessage("Não foi possível salvar seu perfil.");
      setIsSaving(false);
      return;
    }

      setMessageVariant("success");
      setMessage("Perfil atualizado com sucesso.");
      setIsSaving(false);

      router.push("/dashboard");
      router.refresh();
  }

  return (
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
            Telefone <span className="text-red-500"> <strong>(Mesmo do cadastro no APP)</strong></span>
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
            E-mail <span className="text-red-500"> <strong>(Mesmo do cadastro no APP)</strong></span>
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
            onChange={(event) => setCep(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Digite seu CEP"
          />
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

        <div className="pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>

        {message ? (
          <TextMessage variant={messageVariant}>{message}</TextMessage>
        ) : null}
      </form>
    </Card>
  );
}
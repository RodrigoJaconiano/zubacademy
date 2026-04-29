import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileRequestBody = {
  name?: string;
  phone?: string;
  cpf?: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  number?: string;
  terms_accepted?: boolean;
  terms_version?: string;
};

function normalizeCpf(value?: string) {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

function normalizeCep(value?: string) {
  return (value ?? "").replace(/\D/g, "").slice(0, 8);
}

function normalizePhone(value?: string) {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    let body: ProfileRequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 }
      );
    }

    const name = body.name?.trim();
    const phone = normalizePhone(body.phone);
    const cpf = normalizeCpf(body.cpf);
    const cep = normalizeCep(body.cep);
    const address = body.address?.trim();
    const city = body.city?.trim();
    const state = body.state?.trim();
    const number = body.number?.trim();
    const termsAccepted = Boolean(body.terms_accepted);
    const termsVersion = body.terms_version?.trim() || "v1";

    // validações
    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (phone.length < 10 || phone.length > 11) {
      return NextResponse.json(
        {
          error: "Telefone inválido. Use DDD + número (ex: 11934394061).",
        },
        { status: 400 }
      );
    }

    if (cpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido." },
        { status: 400 }
      );
    }

    if (cep.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido." },
        { status: 400 }
      );
    }

    if (!city || !state || !address || !number) {
      return NextResponse.json(
        { error: "Preencha todos os campos de endereço." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "Você precisa aceitar os termos de utilização." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        name,
        phone,
        cpf,
        cep,
        address,
        city,
        state,
        number,
        terms_accepted: true,
        terms_accepted_at: now,
        terms_version: termsVersion,
        updated_at: now,
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error("Erro Supabase:", error);

      return NextResponse.json(
        { error: "Erro ao salvar perfil." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Perfil salvo com sucesso.",
    });
  } catch (error) {
    console.error("POST /api/profile error:", error);

    return NextResponse.json(
      { error: "Erro interno ao salvar perfil." },
      { status: 500 }
    );
  }
}

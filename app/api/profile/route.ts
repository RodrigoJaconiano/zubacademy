import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileRequestBody = {
  name?: string;
  phone?: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  number?: string;
  terms_accepted?: boolean;
  terms_version?: string;
};

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
    const phone = body.phone?.trim();
    const cep = body.cep?.trim();
    const address = body.address?.trim();
    const city = body.city?.trim();
    const state = body.state?.trim();
    const number = body.number?.trim();
    const termsAccepted = Boolean(body.terms_accepted);
    const termsVersion = body.terms_version?.trim() || "v1";

    if (!name || !phone || !cep || !city || !state || !address || !number) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "Você precisa aceitar os termos de utilização." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        name,
        phone,
        cep,
        address,
        city,
        state,
        number,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version: termsVersion,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
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

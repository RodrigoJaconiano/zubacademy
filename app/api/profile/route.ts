import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileRequestBody = {
  name?: string;
  phone?: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
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

    if (!name || !phone || !cep || !city || !state) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios." },
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
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RequestBody = {
  storeId?: string;
  vacancies?: number;
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
        { ok: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("id", user.id)
      .maybeSingle<{ app_role?: string | null }>();

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: "Não foi possível validar as permissões." },
        { status: 500 }
      );
    }

    const isAdmin =
      user.email?.toLowerCase().endsWith("@zubale.com") ||
      profile?.app_role?.toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Acesso negado." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const storeId = body.storeId?.trim();
    const vacancies = body.vacancies;

    if (!storeId) {
      return NextResponse.json(
        { ok: false, error: "storeId é obrigatório." },
        { status: 400 }
      );
    }

    if (
      typeof vacancies !== "number" ||
      !Number.isFinite(vacancies) ||
      vacancies < 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Informe um número de vagas válido." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { error: updateError } = await adminSupabase
      .from("stores")
      .update({
        vacancies: Math.floor(vacancies),
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("Erro ao atualizar vagas da loja:", updateError);

      return NextResponse.json(
        { ok: false, error: "Não foi possível atualizar as vagas." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro inesperado ao atualizar vagas:", error);

    return NextResponse.json(
      { ok: false, error: "Erro interno ao atualizar vagas." },
      { status: 500 }
    );
  }
}

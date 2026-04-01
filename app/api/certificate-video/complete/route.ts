import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        certificate_video_watched: true,
        certificate_video_watched_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Erro ao atualizar profile com vídeo concluído:", updateError);

      return NextResponse.json(
        {
          ok: false,
          error: "Não foi possível registrar a conclusão do vídeo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro inesperado ao concluir vídeo obrigatório:", error);

    return NextResponse.json(
      { ok: false, error: "Erro interno ao concluir vídeo obrigatório." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProgressRequestBody = {
  lessonId?: string;
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

    let body: ProgressRequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 }
      );
    }

    const lessonId = body.lessonId?.trim();

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId é obrigatório." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
      },
      {
        onConflict: "user_id,lesson_id",
      }
    );

    if (error) {
      return NextResponse.json(
        { error: "Erro ao salvar progresso da aula." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Progresso salvo com sucesso.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/progress error:", error);

    return NextResponse.json(
      { error: "Erro interno ao salvar progresso." },
      { status: 500 }
    );
  }
}
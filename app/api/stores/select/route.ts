import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RequestBody = {
  storeId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const storeId = body?.storeId?.trim();

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Loja inválida." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: existingProfile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, store_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar profile antes da seleção:", profileError);
      return NextResponse.json(
        { success: false, message: "Não foi possível validar seu perfil." },
        { status: 500 }
      );
    }

    if (existingProfile?.store_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Você já escolheu uma loja.",
        },
        { status: 409 }
      );
    }

    const { data: store, error: storeError } = await adminSupabase
      .from("stores")
      .select("id, name, vacancies, applied_count, is_active")
      .eq("id", storeId)
      .maybeSingle();

    if (storeError || !store) {
      console.error("Erro ao buscar loja para seleção:", storeError);
      return NextResponse.json(
        { success: false, message: "Loja não encontrada." },
        { status: 404 }
      );
    }

    if (!store.is_active || store.vacancies <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Essa loja não possui mais vagas disponíveis.",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { data: updatedStoreRows, error: updateStoreError } =
      await adminSupabase
        .from("stores")
        .update({
          vacancies: store.vacancies - 1,
          applied_count: store.applied_count + 1,
          updated_at: now,
        })
        .eq("id", storeId)
        .eq("is_active", true)
        .gt("vacancies", 0)
        .select("id, name, vacancies")
        .limit(1);

    if (updateStoreError) {
      console.error("Erro ao atualizar loja:", updateStoreError);
      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível reservar a vaga nesta loja.",
        },
        { status: 500 }
      );
    }

    const updatedStore = updatedStoreRows?.[0];

    if (!updatedStore) {
      return NextResponse.json(
        {
          success: false,
          message: "Essa loja acabou de ficar sem vagas.",
        },
        { status: 409 }
      );
    }

    const { error: upsertProfileError } = await adminSupabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          store_id: storeId,
          store_selected_at: now,
          updated_at: now,
        },
        { onConflict: "id" }
      );

    if (upsertProfileError) {
      console.error("Erro ao salvar store_id no profile:", upsertProfileError);

      return NextResponse.json(
        {
          success: false,
          message: "A vaga foi reservada, mas não conseguimos salvar sua loja.",
        },
        { status: 500 }
      );
    }

    const { error: applicationError } = await adminSupabase
      .from("store_applications")
      .insert({
        user_id: user.id,
        store_id: storeId,
        created_at: now,
      });

    if (applicationError) {
      console.error(
        "Erro ao registrar store_application:",
        applicationError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Loja selecionada com sucesso.",
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
      },
    });
  } catch (error) {
    console.error("Erro em /api/stores/select:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível selecionar a loja.",
      },
      { status: 500 }
    );
  }
}

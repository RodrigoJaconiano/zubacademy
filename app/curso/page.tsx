import { redirect } from "next/navigation";
import CourseClient from "@/components/course/CourseClient";
import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import { courseData } from "@/lib/data/course";
import { createClient } from "@/lib/supabase/server";
import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

type RawProfileRow = {
  name?: string | null;
  phone?: string | null;
  cpf?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | number | null;
  terms_accepted?: boolean | null;
};

export default async function CursoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Acesso ao curso"
          title="Usuário não autenticado"
          description="Faça login para acessar o conteúdo do treinamento."
          actionHref="/login"
          actionLabel="Ir para login"
        />
      </PageContainer>
    );
  }

  const [{ data: progressData, error: progressError }, { data: rawProfile, error: profileError }] =
    await Promise.all([
      supabase.from("lesson_progress").select("*").eq("user_id", user.id),
      supabase
        .from("profiles")
        .select(
          "name, phone, cpf, cep, city, state, address, number, terms_accepted"
        )
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (progressError || profileError) {
    console.error("Erro ao carregar curso:", progressError || profileError);

    return (
      <PageContainer>
        <PageState
          eyebrow="Curso"
          title="Erro ao carregar progresso"
          description="Não foi possível carregar seu andamento no curso agora. Tente novamente em instantes."
        />
      </PageContainer>
    );
  }

  const profileRow = rawProfile as RawProfileRow | null;

  const profile: ProfileData | null = profileRow
    ? {
        name: profileRow.name ?? null,
        phone: profileRow.phone ?? null,
        cpf: profileRow.cpf ?? null,
        cep: profileRow.cep ?? null,
        city: profileRow.city ?? null,
        state: profileRow.state ?? null,
        address: profileRow.address ?? null,
        number:
          profileRow.number === null || profileRow.number === undefined
            ? null
            : String(profileRow.number),
      }
    : null;

  const profileIncomplete = getMissingProfileFields(profile).length > 0;
  const termsAccepted = Boolean(profileRow?.terms_accepted);

  if (profileIncomplete || !termsAccepted) {
    redirect("/perfil");
  }

  return (
    <PageContainer>
      <CourseClient course={courseData} initialProgress={progressData ?? []} />
    </PageContainer>
  );
}

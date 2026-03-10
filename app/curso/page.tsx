import CourseClient from "@/components/course/CourseClient";
import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import { courseData } from "@/lib/data/course";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const { data: progressData, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
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

  return (
    <PageContainer>
      <CourseClient
        course={courseData}
        initialProgress={progressData ?? []}
      />
    </PageContainer>
  );
}
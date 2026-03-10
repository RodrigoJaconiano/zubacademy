import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import QuizClient from "@/components/quiz/QuizClient";
import { createClient } from "@/lib/supabase/server";
import { courseData, quizQuestions } from "@/lib/data/course";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quiz final"
          title="Usuário não autenticado"
          description="Faça login para acessar o quiz final do treinamento."
          actionHref="/login"
          actionLabel="Ir para login"
        />
      </PageContainer>
    );
  }

  const { data: progressData, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", true);

  if (error) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quiz final"
          title="Erro ao carregar progresso"
          description="Não foi possível validar a conclusão do curso neste momento."
        />
      </PageContainer>
    );
  }

  const completedLessons = progressData?.length ?? 0;
  const totalLessons = courseData.lessons.length;
  const allLessonsCompleted = completedLessons === totalLessons;

  if (!allLessonsCompleted) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quiz final"
          title="Ainda não liberado"
          description="Você precisa concluir todas as aulas antes de fazer o quiz."
          actionHref="/curso"
          actionLabel="Voltar para o curso"
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Progresso atual:{" "}
              <span className="font-semibold text-slate-900">
                {completedLessons}/{totalLessons}
              </span>{" "}
              aulas concluídas.
            </p>
          </div>
        </PageState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QuizClient questions={quizQuestions} />
    </PageContainer>
  );
}
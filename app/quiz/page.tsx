import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import QuizClient from "@/components/quiz/QuizClient";
import { createClient } from "@/lib/supabase/server";
import { courseData, getShuffledQuiz } from "@/lib/data/course";
import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

const COURSE_SLUG = "treinamento-zubale";

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

type QuizAttemptRow = {
  id: string;
  score?: number | null;
  passed?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type CertificateRow = {
  id: string;
};

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

  const [
    { data: progressData, error: progressError },
    { data: rawProfile, error: profileError },
    { data: latestAttempt, error: attemptError },
    { data: certificate, error: certificateError },
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true),

    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted"
      )
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("quiz_attempts")
      .select("id, score, passed, completed_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<QuizAttemptRow>(),

    supabase
      .from("certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_slug", COURSE_SLUG)
      .maybeSingle<CertificateRow>(),
  ]);

  if (progressError || profileError || attemptError || certificateError) {
    console.error("Erro ao carregar quiz:", {
      progressError,
      profileError,
      attemptError,
      certificateError,
    });

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
      <QuizClient
        questions={getShuffledQuiz()}
        initialAttempt={latestAttempt ?? null}
        certificateIssued={Boolean(certificate?.id)}
      />
    </PageContainer>
  );
}

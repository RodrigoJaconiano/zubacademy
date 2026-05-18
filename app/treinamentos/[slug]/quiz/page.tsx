import { redirect } from "next/navigation";

import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import QuizClient from "@/components/quiz/QuizClient";

import { createClient } from "@/lib/supabase/server";

import {
  getCourseBySlug,
  getLessonsByCourse,
} from "@/lib/services/course-service";

import { getQuizQuestionsByCourse } from "@/lib/services/quiz-service";

import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
}

function getCertificateCodePrefix(courseSlug: string) {
  return courseSlug
    .replace("-integracao", "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

export default async function CourseQuizPage({ params }: PageProps) {
  const { slug } = await params;

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

  const course = await getCourseBySlug(slug);

  if (!course) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quiz final"
          title="Curso não encontrado"
          description="Não foi possível localizar o treinamento solicitado ou ele ainda não está disponível."
          actionHref="/treinamentos"
          actionLabel="Ver treinamentos"
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
      .eq("course_id", course.id)
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
      .eq("course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<QuizAttemptRow>(),

    supabase
      .from("certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle<CertificateRow>(),
  ]);

  if (progressError || profileError || attemptError || certificateError) {
    console.error("Erro ao carregar quiz do curso:", {
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

  const lessons = await getLessonsByCourse(course.id);
  const quizQuestions = await getQuizQuestionsByCourse(course.id);

  const completedLessons = progressData?.length ?? 0;
  const totalLessons = lessons.length;

  const allLessonsCompleted =
    totalLessons > 0 && completedLessons >= totalLessons;

  if (!allLessonsCompleted) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quiz final"
          title="Quiz ainda não liberado"
          description="Você precisa concluir todas as aulas deste treinamento antes de fazer o quiz."
          actionHref={`/treinamentos/${course.slug}`}
          actionLabel="Continuar aulas"
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

  if (quizQuestions.length === 0) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quiz final"
          title="Quiz não configurado"
          description="Este treinamento ainda não possui perguntas cadastradas."
          actionHref={`/treinamentos/${course.slug}`}
          actionLabel="Voltar para o treinamento"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QuizClient
        courseId={course.id}
        courseSlug={course.slug}
        certificateCodePrefix={getCertificateCodePrefix(course.slug)}
        questions={shuffleArray(quizQuestions).slice(0, 10)}
        initialAttempt={latestAttempt ?? null}
        certificateIssued={Boolean(certificate?.id)}
      />
    </PageContainer>
  );
}

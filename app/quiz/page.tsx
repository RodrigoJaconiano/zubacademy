import Link from "next/link";
import { redirect } from "next/navigation";

import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import SectionHeading from "@/components/ui/section-heading";
import ProgressBar from "@/components/ui/progress-bar";

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

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  active: boolean | null;
  brand_id: string | null;
  brands?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

type LessonRow = {
  id: string;
  course_id: string;
};

type LessonProgressRow = {
  id: string;
  course_id: string | null;
  lesson_id: string | null;
  completed: boolean | null;
};

type QuizQuestionRow = {
  id: string;
  course_id: string;
};

type QuizAttemptRow = {
  id: string;
  course_id: string | null;
  score?: number | null;
  passed?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type CertificateRow = {
  id: string;
  course_id: string | null;
};

function getQuizStatus(params: {
  totalLessons: number;
  completedLessons: number;
  totalQuestions: number;
  quizPassed: boolean;
  certificateIssued: boolean;
}) {
  const {
    totalLessons,
    completedLessons,
    totalQuestions,
    quizPassed,
    certificateIssued,
  } = params;

  if (certificateIssued) {
    return {
      badge: "Certificado emitido",
      badgeVariant: "success" as const,
      title: "Certificação concluída",
      description: "Você já concluiu este quiz e o certificado foi emitido.",
      actionLabel: "Ver certificação",
      actionHref: "/certificado",
      actionEnabled: true,
    };
  }

  if (quizPassed) {
    return {
      badge: "Quiz aprovado",
      badgeVariant: "success" as const,
      title: "Quiz já aprovado",
      description: "Você já foi aprovado neste quiz. Acesse sua certificação.",
      actionLabel: "Ir para certificações",
      actionHref: "/certificado",
      actionEnabled: true,
    };
  }

  if (totalQuestions === 0) {
    return {
      badge: "Indisponível",
      badgeVariant: "warning" as const,
      title: "Quiz ainda não configurado",
      description: "Este treinamento ainda não possui perguntas cadastradas.",
      actionLabel: "Ver treinamentos",
      actionHref: "/treinamentos",
      actionEnabled: true,
    };
  }

  if (totalLessons === 0) {
    return {
      badge: "Indisponível",
      badgeVariant: "warning" as const,
      title: "Treinamento sem aulas",
      description: "Este treinamento ainda não possui aulas disponíveis.",
      actionLabel: "Ver treinamentos",
      actionHref: "/treinamentos",
      actionEnabled: true,
    };
  }

  if (completedLessons < totalLessons) {
    return {
      badge: "Bloqueado",
      badgeVariant: "warning" as const,
      title: "Quiz ainda não liberado",
      description: `Conclua todas as aulas para liberar o quiz. Progresso atual: ${completedLessons}/${totalLessons} aulas.`,
      actionLabel: "Continuar aulas",
      actionHref: "",
      actionEnabled: true,
    };
  }

  return {
    badge: "Liberado",
    badgeVariant: "info" as const,
    title: "Quiz liberado",
    description: "Você concluiu todas as aulas e já pode fazer o quiz final.",
    actionLabel: "Fazer quiz",
    actionHref: "",
    actionEnabled: true,
  };
}

export default async function QuizPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Quizzes"
          title="Usuário não autenticado"
          description="Faça login para acessar os quizzes dos treinamentos."
          actionHref="/login"
          actionLabel="Ir para login"
        />
      </PageContainer>
    );
  }

  const [
    { data: rawProfile, error: profileError },
    { data: courses, error: coursesError },
    { data: lessons, error: lessonsError },
    { data: progressRows, error: progressError },
    { data: quizQuestions, error: questionsError },
    { data: quizAttempts, error: attemptsError },
    { data: certificates, error: certificatesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted"
      )
      .eq("id", user.id)
      .maybeSingle<RawProfileRow>(),

    supabase
      .from("courses")
      .select(
        `
        id,
        slug,
        title,
        description,
        active,
        brand_id,
        brands (
          id,
          name,
          slug
        )
      `
      )
      .eq("active", true)
      .order("title", { ascending: true })
      .returns<CourseRow[]>(),

    supabase
      .from("lessons")
      .select("id, course_id")
      .eq("is_active", true)
      .returns<LessonRow[]>(),

    supabase
      .from("lesson_progress")
      .select("id, course_id, lesson_id, completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .returns<LessonProgressRow[]>(),

    supabase
      .from("quiz_questions")
      .select("id, course_id")
      .eq("is_active", true)
      .returns<QuizQuestionRow[]>(),

    supabase
      .from("quiz_attempts")
      .select("id, course_id, score, passed, completed_at, created_at")
      .eq("user_id", user.id)
      .returns<QuizAttemptRow[]>(),

    supabase
      .from("certificates")
      .select("id, course_id")
      .eq("user_id", user.id)
      .returns<CertificateRow[]>(),
  ]);

  if (
    profileError ||
    coursesError ||
    lessonsError ||
    progressError ||
    questionsError ||
    attemptsError ||
    certificatesError
  ) {
    console.error("Erro ao carregar central de quizzes:", {
      profileError,
      coursesError,
      lessonsError,
      progressError,
      questionsError,
      attemptsError,
      certificatesError,
    });

    return (
      <PageContainer>
        <PageState
          eyebrow="Quizzes"
          title="Erro ao carregar quizzes"
          description="Não foi possível carregar seus quizzes agora. Tente novamente em instantes."
        />
      </PageContainer>
    );
  }

  const profileRow = rawProfile ?? null;

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

  const safeCourses = courses ?? [];
  const safeLessons = lessons ?? [];
  const safeProgressRows = progressRows ?? [];
  const safeQuizQuestions = quizQuestions ?? [];
  const safeQuizAttempts = quizAttempts ?? [];
  const safeCertificates = certificates ?? [];

  const totalLessonsByCourseId = new Map<string, number>();
  const completedLessonsByCourseId = new Map<string, number>();
  const totalQuestionsByCourseId = new Map<string, number>();
  const quizPassedByCourseId = new Set<string>();
  const certificateByCourseId = new Set<string>();

  for (const lesson of safeLessons) {
    totalLessonsByCourseId.set(
      lesson.course_id,
      (totalLessonsByCourseId.get(lesson.course_id) ?? 0) + 1
    );
  }

  for (const progress of safeProgressRows) {
    if (!progress.course_id) continue;

    completedLessonsByCourseId.set(
      progress.course_id,
      (completedLessonsByCourseId.get(progress.course_id) ?? 0) + 1
    );
  }

  for (const question of safeQuizQuestions) {
    totalQuestionsByCourseId.set(
      question.course_id,
      (totalQuestionsByCourseId.get(question.course_id) ?? 0) + 1
    );
  }

  for (const attempt of safeQuizAttempts) {
    if (attempt.course_id && attempt.passed) {
      quizPassedByCourseId.add(attempt.course_id);
    }
  }

  for (const certificate of safeCertificates) {
    if (certificate.course_id) {
      certificateByCourseId.add(certificate.course_id);
    }
  }

  const quizCards = safeCourses.map((course) => {
    const totalLessons = totalLessonsByCourseId.get(course.id) ?? 0;
    const completedLessons = completedLessonsByCourseId.get(course.id) ?? 0;
    const totalQuestions = totalQuestionsByCourseId.get(course.id) ?? 0;
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const status = getQuizStatus({
      totalLessons,
      completedLessons,
      totalQuestions,
      quizPassed: quizPassedByCourseId.has(course.id),
      certificateIssued: certificateByCourseId.has(course.id),
    });

    const courseHref = `/treinamentos/${course.slug}`;
    const quizHref = `/treinamentos/${course.slug}/quiz`;

    return {
      course,
      totalLessons,
      completedLessons,
      totalQuestions,
      progressPercentage,
      status: {
        ...status,
        actionHref:
          status.actionLabel === "Fazer quiz"
            ? quizHref
            : status.actionLabel === "Continuar aulas"
              ? courseHref
              : status.actionHref,
      },
    };
  });

  return (
    <PageContainer className="space-y-8">
      <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.96))] p-6">
        <SectionHeading
          eyebrow="Quizzes"
          title="Escolha o quiz do treinamento"
          description="Cada treinamento possui seu próprio quiz. O quiz só é liberado depois que todas as aulas daquele curso forem concluídas."
        />
      </Card>

      {quizCards.length === 0 ? (
        <PageState
          eyebrow="Quizzes"
          title="Nenhum treinamento disponível"
          description="Ainda não há treinamentos online disponíveis para quiz."
          actionHref="/treinamentos"
          actionLabel="Ver treinamentos"
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {quizCards.map(
            ({
              course,
              totalLessons,
              completedLessons,
              totalQuestions,
              progressPercentage,
              status,
            }) => (
              <Card key={course.id} className="rounded-[28px] p-5">
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-blue-700">
                          {course.brands?.name ?? "Treinamento"}
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                          {course.title}
                        </h2>
                      </div>

                      <Badge variant={status.badgeVariant}>
                        {status.badge}
                      </Badge>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {status.description}
                    </p>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500">
                            Progresso das aulas
                          </p>

                          <p className="mt-1 text-base font-semibold text-slate-900">
                            {completedLessons}/{totalLessons} aulas concluídas
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-blue-700">
                          {progressPercentage}%
                        </p>
                      </div>

                      <ProgressBar value={progressPercentage} />

                    </div>
                  </div>

                  <Link
                    href={status.actionHref}
                    className={`inline-flex w-fit items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition duration-200 ${
                      status.badge === "Liberado"
                        ? "bg-blue-600 !text-white hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {status.actionLabel}
                  </Link>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </PageContainer>
  );
}

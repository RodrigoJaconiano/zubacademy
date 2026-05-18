import Link from "next/link";

import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import SectionHeading from "@/components/ui/section-heading";

import CertificatePreview from "@/components/certificate/CertificatePreview";
import CertificateActions from "@/components/certificate/CertificateActions";
import CertificateUnlockVideo from "@/components/certificate/CertificateUnlockVideo";

import { createClient } from "@/lib/supabase/server";

import {
  getCertificateVideoByCourse,
} from "@/lib/services/course-service";

import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    course?: string;
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
  certificate_video_watched?: boolean | null;
};

type CourseRow = {
  id: string;
  brand_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  active: boolean | null;
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
  course_slug?: string | null;
  certificate_code?: string | null;
  issued_at?: string | null;
};

type CertificateFeedbackRow = {
  id: string;
  course_slug?: string | null;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(dateString));
}

function calculateProgress(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function getCertificationStatus({
  totalLessons,
  completedLessons,
  quizPassed,
  certificateIssued,
}: {
  totalLessons: number;
  completedLessons: number;
  quizPassed: boolean;
  certificateIssued: boolean;
}) {
  const allLessonsCompleted =
    totalLessons > 0 && completedLessons >= totalLessons;

  if (certificateIssued) {
    return {
      label: "Certificado emitido",
      variant: "success" as const,
      description: "Seu certificado já está disponível.",
    };
  }

  if (quizPassed) {
    return {
      label: "Aguardando certificado",
      variant: "info" as const,
      description:
        "Você foi aprovado no quiz. O certificado ainda não foi localizado.",
    };
  }

  if (allLessonsCompleted) {
    return {
      label: "Quiz liberado",
      variant: "success" as const,
      description: "Você concluiu as aulas. Agora falta realizar o quiz.",
    };
  }

  if (completedLessons > 0) {
    return {
      label: "Em andamento",
      variant: "info" as const,
      description: "Continue o treinamento para liberar o quiz e o certificado.",
    };
  }

  return {
    label: "Não iniciado",
    variant: "warning" as const,
    description: "Esse treinamento ainda não foi iniciado.",
  };
}

export default async function CertificadoPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const selectedCourseSlug = params?.course?.trim() || null;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Erro ao buscar usuário autenticado:", userError);
  }

  if (!user) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificações"
          title="Usuário não autenticado"
          description="Faça login para acessar suas certificações."
          actionHref="/login"
          actionLabel="Ir para login"
        />
      </PageContainer>
    );
  }

  const [
    profileResponse,
    coursesResponse,
    lessonsResponse,
    progressResponse,
    quizResponse,
    certificatesResponse,
    feedbackResponse,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted, certificate_video_watched"
      )
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("courses")
      .select("id, brand_id, slug, title, description, active")
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
      .from("quiz_attempts")
      .select("id, course_id, score, passed, completed_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<QuizAttemptRow[]>(),

    supabase
      .from("certificates")
      .select("id, course_id, course_slug, certificate_code, issued_at")
      .eq("user_id", user.id)
      .returns<CertificateRow[]>(),

    supabase
      .from("certificate_feedback")
      .select("id, course_slug")
      .eq("user_id", user.id)
      .returns<CertificateFeedbackRow[]>(),
  ]);

  const { data: rawProfile, error: profileError } = profileResponse;
  const { data: courses, error: coursesError } = coursesResponse;
  const { data: lessons, error: lessonsError } = lessonsResponse;
  const { data: progressRows, error: progressError } = progressResponse;
  const { data: quizAttempts, error: quizError } = quizResponse;
  const { data: certificates, error: certificatesError } = certificatesResponse;
  const { data: feedbackRows, error: feedbackError } = feedbackResponse;

  if (
    profileError ||
    coursesError ||
    lessonsError ||
    progressError ||
    quizError ||
    certificatesError ||
    feedbackError
  ) {
    console.error("Erro ao carregar certificações:", {
      profileError,
      coursesError,
      lessonsError,
      progressError,
      quizError,
      certificatesError,
      feedbackError,
    });

    return (
      <PageContainer>
        <PageState
          eyebrow="Certificações"
          title="Erro ao carregar certificações"
          description="Não foi possível carregar suas certificações neste momento."
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
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificações"
          title="Complete seu cadastro para continuar"
          description="Antes de acessar suas certificações, você precisa preencher seus dados obrigatórios e aceitar os termos."
          actionHref="/perfil"
          actionLabel="Ir para meu perfil"
        />
      </PageContainer>
    );
  }

  const safeCourses = courses ?? [];
  const safeLessons = lessons ?? [];
  const safeProgressRows = progressRows ?? [];
  const safeQuizAttempts = quizAttempts ?? [];
  const safeCertificates = certificates ?? [];
  const safeFeedbackRows = feedbackRows ?? [];

  const totalLessonsByCourseId = new Map<string, number>();
  const completedLessonsByCourseId = new Map<string, number>();
  const latestQuizAttemptByCourseId = new Map<string, QuizAttemptRow>();
  const certificateByCourseId = new Map<string, CertificateRow>();
  const feedbackByCourseSlug = new Map<string, CertificateFeedbackRow>();

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

  for (const attempt of safeQuizAttempts) {
    if (!attempt.course_id) continue;

    if (!latestQuizAttemptByCourseId.has(attempt.course_id)) {
      latestQuizAttemptByCourseId.set(attempt.course_id, attempt);
    }
  }

  for (const certificate of safeCertificates) {
    if (!certificate.course_id) continue;

    certificateByCourseId.set(certificate.course_id, certificate);
  }

  for (const feedback of safeFeedbackRows) {
    if (!feedback.course_slug) continue;

    feedbackByCourseSlug.set(feedback.course_slug, feedback);
  }

  const selectedCourse = selectedCourseSlug
    ? safeCourses.find((course) => course.slug === selectedCourseSlug)
    : null;

  if (selectedCourseSlug && !selectedCourse) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificações"
          title="Treinamento não encontrado"
          description="Não foi possível localizar a certificação solicitada."
          actionHref="/certificado"
          actionLabel="Voltar para certificações"
        />
      </PageContainer>
    );
  }

  if (selectedCourse) {
    const totalLessons = totalLessonsByCourseId.get(selectedCourse.id) ?? 0;
    const completedLessons =
      completedLessonsByCourseId.get(selectedCourse.id) ?? 0;

    const allLessonsCompleted =
      totalLessons > 0 && completedLessons >= totalLessons;

    const latestAttempt = latestQuizAttemptByCourseId.get(selectedCourse.id);
    const quizPassed = Boolean(latestAttempt?.passed);

    const certificate = certificateByCourseId.get(selectedCourse.id);

    if (!allLessonsCompleted) {
      return (
        <PageContainer>
          <PageState
            eyebrow="Certificações"
            title="Certificado ainda não liberado"
            description="Você precisa concluir todas as aulas antes de acessar este certificado."
            actionHref={`/treinamentos/${selectedCourse.slug}`}
            actionLabel="Continuar treinamento"
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

    if (!quizPassed) {
      return (
        <PageContainer>
          <PageState
            eyebrow="Certificações"
            title="Certificado ainda não liberado"
            description="Você precisa concluir e ser aprovado no quiz final antes de acessar este certificado."
            actionHref={`/treinamentos/${selectedCourse.slug}/quiz`}
            actionLabel="Ir para o quiz"
          />
        </PageContainer>
      );
    }

    if (!certificate) {
      return (
        <PageContainer>
          <PageState
            eyebrow="Certificações"
            title="Certificado ainda não disponível"
            description="Sua aprovação foi registrada, mas o certificado ainda não foi localizado."
            actionHref="/certificado"
            actionLabel="Voltar para certificações"
          />
        </PageContainer>
      );
    }

    const certificateVideo = await getCertificateVideoByCourse(selectedCourse.id);

    const certificateUnlocked = Boolean(profileRow?.certificate_video_watched);
    const hasSubmittedFeedback = Boolean(
      feedbackByCourseSlug.get(selectedCourse.slug)?.id
    );

    const studentName =
      profile?.name?.trim() ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Aluno(a)";

    const videoTitle =
      certificateVideo?.title ??
      "Vídeo obrigatório para liberação do certificado";

    const videoDescription =
      certificateVideo?.description ??
      "Assista ao vídeo até o final para liberar a visualização completa e o download do seu certificado.";

    const videoId = certificateVideo?.video_id ?? "LswDcX0c08I";

    return (
      <PageContainer className="space-y-6">
        <div>
          <Link
            href="/certificado"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800 hover:underline"
          >
            ← Voltar para certificações
          </Link>
        </div>

        <CertificateUnlockVideo
          title={videoTitle}
          description={videoDescription}
          videoId={videoId}
          initiallyCompleted={certificateUnlocked}
        />

        <CertificatePreview
          studentName={studentName}
          courseTitle={selectedCourse.title}
          issuedAt={
            certificate.issued_at
              ? formatDate(certificate.issued_at)
              : "Data não informada"
          }
          certificateCode={certificate.certificate_code || "Sem código"}
          locked={!certificateUnlocked}
          lockedMessage="Assista ao vídeo obrigatório até o final para liberar seu certificado."
        />

        <CertificateActions
          isUnlocked={certificateUnlocked}
          courseSlug={selectedCourse.slug}
          hasSubmittedFeedback={hasSubmittedFeedback}
        />
      </PageContainer>
    );
  }

  const certificationCards = safeCourses.map((course) => {
    const totalLessons = totalLessonsByCourseId.get(course.id) ?? 0;
    const completedLessons = completedLessonsByCourseId.get(course.id) ?? 0;
    const progressPercentage = calculateProgress(completedLessons, totalLessons);

    const latestAttempt = latestQuizAttemptByCourseId.get(course.id);
    const quizPassed = Boolean(latestAttempt?.passed);

    const certificate = certificateByCourseId.get(course.id);
    const certificateIssued = Boolean(certificate?.id);

    const status = getCertificationStatus({
      totalLessons,
      completedLessons,
      quizPassed,
      certificateIssued,
    });

    return {
      course,
      totalLessons,
      completedLessons,
      progressPercentage,
      quizPassed,
      certificate,
      certificateIssued,
      status,
    };
  });

  const issuedCount = certificationCards.filter(
    (item) => item.certificateIssued
  ).length;

  const startedCount = certificationCards.filter(
    (item) => item.completedLessons > 0 || item.quizPassed || item.certificateIssued
  ).length;

  return (
    <PageContainer className="space-y-8">
      <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.96))]">
        <SectionHeading
          eyebrow="Certificações"
          title="Suas certificações"
          description="Acompanhe seus certificados por marca. Cada treinamento concluído pode gerar um certificado próprio."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-sm text-slate-500">Treinamentos disponíveis</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {safeCourses.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-sm text-slate-500">Treinamentos iniciados</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {startedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-sm text-slate-500">Certificados emitidos</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {issuedCount}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {certificationCards.map((item) => {
          const {
            course,
            totalLessons,
            completedLessons,
            progressPercentage,
            quizPassed,
            certificateIssued,
            status,
          } = item;

          const allLessonsCompleted =
            totalLessons > 0 && completedLessons >= totalLessons;

          let actionHref = `/treinamentos/${course.slug}`;
          let actionLabel = completedLessons > 0 ? "Continuar treinamento" : "Iniciar treinamento";

          if (certificateIssued) {
            actionHref = `/certificado?course=${course.slug}`;
            actionLabel = "Ver certificado";
          } else if (allLessonsCompleted && !quizPassed) {
            actionHref = `/treinamentos/${course.slug}/quiz`;
            actionLabel = "Fazer quiz";
          }

          return (
            <Card key={course.id} className="rounded-[28px] p-5">
              <div className="flex h-full flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Certificação
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {course.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {course.description ??
                          "Treinamento disponível para certificação."}
                      </p>
                    </div>

                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Progresso</p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {completedLessons}/{totalLessons} aulas concluídas
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-blue-700">
                        {progressPercentage}%
                      </p>
                    </div>

                    <ProgressBar value={progressPercentage} />

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {status.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={actionHref}
                  className={`inline-flex w-fit items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 ${
                    certificateIssued
                      ? "bg-emerald-600 !text-white hover:bg-emerald-700"
                      : "bg-blue-600 !text-white hover:bg-blue-700"
                  }`}
                >
                  {actionLabel}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

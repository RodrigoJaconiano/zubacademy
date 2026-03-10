import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { courseData } from "@/lib/data/course";

import PageContainer from "@/components/ui/page-container";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import SectionHeading from "@/components/ui/section-heading";

import {
  getDashboardState,
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

type QuizAttemptRow = {
  id: string;
  passed?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type CertificateRow = {
  id: string;
  certificate_code?: string | null;
  issued_at?: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer>
        <Card>
          <SectionHeading
            eyebrow="Painel"
            title="Área do aluno"
            description="Você precisa estar autenticado para acessar seu progresso."
          />

          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ir para o login
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const [
    { data: progressData, error: progressError },
    { data: profile, error: profileError },
    { data: certificateData, error: certificateError },
    { data: quizAttemptData, error: quizError },
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", true),

    supabase
      .from("profiles")
      .select("name, phone, cep, city, state, address")
      .eq("id", user.id)
      .single<ProfileData>(),

    supabase
      .from("certificates")
      .select("id, certificate_code, issued_at")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle<CertificateRow>(),

    supabase
      .from("quiz_attempts")
      .select("id, passed, completed_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<QuizAttemptRow>(),
  ]);

  if (progressError || profileError || certificateError || quizError) {
    return (
      <PageContainer>
        <Card>
          <SectionHeading
            eyebrow="Painel"
            title="Área do aluno"
            description="Não foi possível carregar o progresso do curso."
          />
          <p className="text-sm text-slate-600">
            Verifique as consultas do dashboard e tente novamente em instantes.
          </p>
        </Card>
      </PageContainer>
    );
  }

  const missingProfileFields = getMissingProfileFields(profile);
  const profileIncomplete = missingProfileFields.length > 0;

  const completedLessons = progressData?.length ?? 0;
  const totalLessons = courseData.lessons.length;

  const quizCompleted = Boolean(
    quizAttemptData?.passed || quizAttemptData?.completed_at
  );

  const certificateIssued = Boolean(certificateData?.id);

  const dashboardState = getDashboardState({
    totalLessons,
    completedLessons,
    profileIncomplete,
    quizCompleted,
    certificateIssued,
  });

  return (
    <PageContainer className="space-y-8">
      <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.92))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionHeading
              eyebrow="Painel do aluno"
              title="Bem-vindo de volta"
              description="Acompanhe seu progresso, continue as aulas e avance para a certificação."
            />

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-slate-500">Usuário logado</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile?.name ?? user.email}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm leading-5 text-slate-500">Curso</p>
              <p className="mt-3 text-2xl font-bold leading-none text-slate-900">1</p>
            </div>

            <div className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm leading-5 text-slate-500">Aulas concluídas</p>
              <p className="mt-3 text-2xl font-bold leading-none text-slate-900">
                {completedLessons}/{totalLessons}
              </p>
            </div>

            <div className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm leading-5 text-slate-500">Progresso</p>
              <p className="mt-3 text-2xl font-bold leading-none text-slate-900">
                {dashboardState.progressPercentage}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {profileIncomplete && (
        <Card className="rounded-[28px] border-amber-200 bg-amber-50/80">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-amber-700">
                Cadastro incompleto
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Complete seus dados antes de avançar
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Para liberar todas as etapas da plataforma e emitir seu
                certificado corretamente, precisamos que seu perfil esteja
                completo.
              </p>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Campos pendentes:
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {missingProfileFields.map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                    >
                      {field}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  Enquanto isso, algumas ações ficarão bloqueadas, como quiz
                  final e certificação.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <Link
                href="/perfil"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-md lg:w-auto"
              >
                Completar cadastro
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Curso em andamento
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {courseData.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {courseData.description}
                </p>
              </div>

              <Badge
                variant={
                  dashboardState.progressPercentage === 100 ? "success" : "info"
                }
              >
                {dashboardState.progressPercentage === 100
                  ? "Concluído"
                  : "Em progresso"}
              </Badge>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Seu avanço</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {completedLessons} de {totalLessons} aulas concluídas
                  </p>
                </div>

                <p className="text-sm font-semibold text-blue-700">
                  {dashboardState.progressPercentage}%
                </p>
              </div>

              <ProgressBar value={dashboardState.progressPercentage} />
            </div>

{dashboardState.certificateUnlocked ? (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-emerald-700">
          Parabéns, você finalizou o curso.
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Seu certificado já está disponível para visualização e download.
        </p>
      </div>

      <Link
        href="/certificado"
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
      >
        Ver certificado
      </Link>
    </div>
  </div>
) : (
  <div className="flex flex-col gap-3 sm:flex-row">
    <Link
      href="/curso"
      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
    >
      {dashboardState.primaryCourseActionLabel}
    </Link>

    <Link
      href={profileIncomplete ? "/perfil" : "/quiz"}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 ${
        dashboardState.quizUnlocked && !quizCompleted
          ? "border border-blue-200 bg-blue-50 text-blue-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
          : "border border-slate-200 bg-slate-100 text-slate-400"
      }`}
    >
      {profileIncomplete
        ? "Complete o cadastro para liberar o quiz"
        : quizCompleted
        ? "Quiz concluído"
        : dashboardState.quizUnlocked
        ? "Ir para o quiz final"
        : "Quiz bloqueado"}
    </Link>
  </div>
)}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[28px]">
            <p className="text-sm font-medium text-blue-700">Próximo passo</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {dashboardState.nextStep.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {dashboardState.nextStep.description}
            </p>

            <div className="mt-5">
              <Badge variant={dashboardState.nextStep.badgeVariant}>
                {dashboardState.nextStep.badgeLabel}
              </Badge>
            </div>
          </Card>

          <Card className="rounded-[28px]">
            <p className="text-sm font-medium text-blue-700">Certificação</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              Status do certificado
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {dashboardState.certificate.description}
            </p>

            <div className="mt-5 flex items-center justify-between gap-4">
              <Badge variant={dashboardState.certificate.badgeVariant}>
                {dashboardState.certificate.badgeLabel}
              </Badge>

              <Link
                href={dashboardState.certificate.actionHref}
                className="text-sm font-semibold text-blue-700 transition hover:text-blue-800 hover:underline"
              >
                {dashboardState.certificate.actionLabel}
              </Link>
            </div>
          </Card>

          <Card className="rounded-[28px]">
            <p className="text-sm font-medium text-blue-700">Acesso rápido</p>

            <div className="mt-4 grid gap-3">
              <Link
                href="/curso"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Abrir curso
              </Link>

              <Link
                href={dashboardState.quickQuizHref}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  dashboardState.quizUnlocked && !quizCompleted
                    ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    : profileIncomplete
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                {dashboardState.quickQuizLabel}
              </Link>

              <Link
                href={dashboardState.quickCertificateHref}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  profileIncomplete
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {dashboardState.quickCertificateLabel}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

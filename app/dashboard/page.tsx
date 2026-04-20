import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { courseData } from "@/lib/data/course";
import WelcomePopup from "@/components/ui/WelcomePopup"

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
  store_id?: string | null;
  certificate_video_watched?: boolean | null;
};

type LessonProgressRow = {
  id: string;
};

type StoreApplicationRow = {
  id: string;
  is_primary?: boolean | null;
  store_id?: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: progressData, error: progressError },
    { data: rawProfile, error: profileError },
    { data: certificateData, error: certificateError },
    { data: quizAttemptData, error: quizError },
    { data: applications, error: applicationsError },
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .returns<LessonProgressRow[]>(),

    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id, certificate_video_watched"
      )
      .eq("id", user.id)
      .maybeSingle<RawProfileRow>(),

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

    supabase
      .from("store_applications")
      .select("id, is_primary, store_id")
      .eq("user_id", user.id)
      .returns<StoreApplicationRow[]>(),
  ]);

  if (
    progressError ||
    profileError ||
    certificateError ||
    quizError ||
    applicationsError
  ) {
    console.error("progressError:", progressError);
    console.error("profileError:", profileError);
    console.error("certificateError:", certificateError);
    console.error("quizError:", quizError);
    console.error("applicationsError:", applicationsError);

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

  const profileRow = rawProfile ?? null;
  const primaryApplication =
    applications?.find((application) => application.is_primary) ?? null;

  const hasSelectedStore = Boolean(
    profileRow?.store_id || primaryApplication?.store_id
  );

  if (!hasSelectedStore) {
    redirect("/unidade");
  }

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

  const missingProfileFields = getMissingProfileFields(profile);
  const profileIncomplete = missingProfileFields.length > 0;
  const termsAccepted = Boolean(profileRow?.terms_accepted);

  if (profileIncomplete || !termsAccepted) {
    redirect("/perfil");
  }

  const completedLessons = progressData?.length ?? 0;
  const totalLessons = courseData.lessons.length;

  const quizCompleted = Boolean(
    quizAttemptData?.passed || quizAttemptData?.completed_at
  );

  const certificateIssued = Boolean(certificateData?.id);
  const certificateVideoWatched = Boolean(profileRow?.certificate_video_watched);

  const dashboardState = getDashboardState({
    totalLessons,
    completedLessons,
    profileIncomplete,
    quizCompleted,
    certificateIssued,
    certificateVideoWatched,
  });

return (
  <>
    <WelcomePopup />

    <PageContainer className="space-y-8">
      <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.92))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionHeading
              eyebrow="Painel do aluno"
              title="Boas-vindas!"
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
              <p className="mt-3 text-2xl font-bold leading-none text-slate-900">
                1
              </p>
            </div>

            <div className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm leading-5 text-slate-500">
                Aulas concluídas
              </p>
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
                      Seu certificado já está disponível para visualização e
                      download.
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
            ) : dashboardState.certificateIssuedButLocked ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-700">
                      Falta uma última etapa para liberar o certificado.
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Seu certificado já foi emitido, mas você ainda precisa
                      assistir ao vídeo obrigatório até o fim.
                    </p>
                  </div>

                  <Link
                    href="/certificado"
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-md"
                  >
                    Assistir vídeo e liberar
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
                  href="/quiz"
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    dashboardState.quizUnlocked && !quizCompleted
                      ? "border border-blue-200 bg-blue-50 text-blue-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
                      : "border border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  {quizCompleted
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
                    : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                {dashboardState.quickQuizLabel}
              </Link>

              <Link
                href={dashboardState.quickCertificateHref}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {dashboardState.quickCertificateLabel}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
    </>
  );
}

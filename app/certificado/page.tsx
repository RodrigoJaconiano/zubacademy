import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import CertificatePreview from "@/components/certificate/CertificatePreview";
import CertificateActions from "@/components/certificate/CertificateActions";
import CertificateUnlockVideo from "@/components/certificate/CertificateUnlockVideo";
import { createClient } from "@/lib/supabase/server";
import { certificateUnlockVideo, courseData } from "@/lib/data/course";
import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

const COURSE_SLUG = "treinamento-zubale";
const COURSE_TITLE = "Treinamento Zubale";

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

type QuizAttemptRow = {
  id: string;
  score?: number | null;
  passed?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type CertificateRow = {
  certificate_code?: string | null;
  issued_at?: string | null;
  course_slug?: string | null;
};

type LessonProgressRow = {
  id: string;
};

type CertificateFeedbackRow = {
  id: string;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(dateString));
}

export default async function CertificadoPage() {
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
          eyebrow="Certificação"
          title="Usuário não autenticado"
          description="Faça login para acessar seu certificado."
          actionHref="/login"
          actionLabel="Ir para login"
        />
      </PageContainer>
    );
  }

  const [
    profileResponse,
    certificateResponse,
    progressResponse,
    quizResponse,
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
      .from("certificates")
      .select("certificate_code, issued_at, course_slug")
      .eq("user_id", user.id)
      .eq("course_slug", COURSE_SLUG)
      .maybeSingle<CertificateRow>(),
    supabase
      .from("lesson_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .returns<LessonProgressRow[]>(),
    supabase
      .from("quiz_attempts")
      .select("id, score, passed, completed_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<QuizAttemptRow>(),
    supabase
      .from("certificate_feedback")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_slug", COURSE_SLUG)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<CertificateFeedbackRow>(),
  ]);

  const { data: rawProfile, error: profileError } = profileResponse;
  const { data: certificate, error: certificateError } = certificateResponse;
  const { data: progressData, error: progressError } = progressResponse;
  const { data: latestAttempt, error: quizError } = quizResponse;
  const { data: existingFeedback, error: feedbackError } = feedbackResponse;

  if (profileError) {
    console.error("Erro ao buscar profile:", JSON.stringify(profileError, null, 2));
  }

  if (certificateError) {
    console.error(
      "Erro ao buscar certificate:",
      JSON.stringify(certificateError, null, 2)
    );
  }

  if (progressError) {
    console.error(
      "Erro ao buscar progresso das aulas:",
      JSON.stringify(progressError, null, 2)
    );
  }

  if (quizError) {
    console.error(
      "Erro ao buscar tentativa do quiz:",
      JSON.stringify(quizError, null, 2)
    );
  }

  if (feedbackError) {
    console.error(
      "Erro ao buscar feedback do certificado:",
      JSON.stringify(feedbackError, null, 2)
    );
  }

  if (profileError || certificateError || progressError || quizError || feedbackError) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificação"
          title="Erro ao carregar certificado"
          description="Não foi possível carregar seu certificado neste momento. Tente novamente em instantes."
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
          eyebrow="Certificação"
          title="Complete seu cadastro para continuar"
          description="Antes de acessar o certificado, você precisa preencher seus dados obrigatórios e aceitar os termos."
          actionHref="/perfil"
          actionLabel="Ir para meu perfil"
        />
      </PageContainer>
    );
  }

  const completedLessons = progressData?.length ?? 0;
  const totalLessons = courseData.lessons.length;
  const allLessonsCompleted = totalLessons > 0 && completedLessons >= totalLessons;

  if (!allLessonsCompleted) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificação"
          title="Certificado ainda não liberado"
          description="Você precisa concluir todas as aulas antes de acessar seu certificado."
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

  const quizPassed = Boolean(latestAttempt?.passed);

  if (!quizPassed) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificação"
          title="Certificado ainda não liberado"
          description="Você precisa concluir e ser aprovado no quiz final antes de acessar seu certificado."
          actionHref="/quiz"
          actionLabel="Ir para o quiz"
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Status atual:{" "}
              <span className="font-semibold text-slate-900">
                quiz final pendente
              </span>
              .
            </p>
          </div>
        </PageState>
      </PageContainer>
    );
  }

  if (!certificate) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificação"
          title="Certificado ainda não disponível"
          description="Seu certificado ainda está sendo preparado. Tente novamente em instantes."
          actionHref="/dashboard"
          actionLabel="Voltar ao painel"
        />
      </PageContainer>
    );
  }

  const certificateUnlocked = Boolean(profileRow?.certificate_video_watched);
  const hasSubmittedFeedback = Boolean(existingFeedback?.id);

  const studentName =
    profile?.name?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Aluno(a)";

  return (
    <PageContainer className="space-y-6">
      <CertificateUnlockVideo
        title={certificateUnlockVideo.title}
        description={certificateUnlockVideo.description}
        videoId={certificateUnlockVideo.videoId}
        initiallyCompleted={certificateUnlocked}
      />

      <CertificatePreview
        studentName={studentName}
        courseTitle={COURSE_TITLE}
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
        courseSlug={COURSE_SLUG}
        hasSubmittedFeedback={hasSubmittedFeedback}
      />
    </PageContainer>
  );
}

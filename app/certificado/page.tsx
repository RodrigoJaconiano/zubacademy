import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import CertificatePreview from "@/components/certificate/CertificatePreview";
import CertificateActions from "@/components/certificate/CertificateActions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const COURSE_SLUG = "treinamento-zubale";
const COURSE_TITLE = "Treinamento Zubale";

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

  const profileResponse = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const certificateResponse = await supabase
    .from("certificates")
    .select("certificate_code, issued_at, course_slug")
    .eq("user_id", user.id)
    .eq("course_slug", COURSE_SLUG)
    .maybeSingle();

  const { data: profile, error: profileError } = profileResponse;
  const { data: certificate, error: certificateError } = certificateResponse;

  if (profileError) {
    console.error("Erro ao buscar profile:", JSON.stringify(profileError, null, 2));
  }

  if (certificateError) {
    console.error(
      "Erro ao buscar certificate:",
      JSON.stringify(certificateError, null, 2)
    );
  }

  if (certificateError) {
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

  if (!certificate) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Certificação"
          title="Certificado ainda não disponível"
          description="Seu certificado será liberado automaticamente após a aprovação no quiz final."
          actionHref="/quiz"
          actionLabel="Ir para o quiz"
        />
      </PageContainer>
    );
  }

  const studentName =
    profile?.name?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Aluno(a)";

  return (
    <PageContainer>
      <CertificatePreview
        studentName={studentName}
        courseTitle={COURSE_TITLE}
        issuedAt={
          certificate.issued_at
            ? formatDate(certificate.issued_at)
            : "Data não informada"
        }
        certificateCode={certificate.certificate_code || "Sem código"}
      />

      <CertificateActions />
    </PageContainer>
  );
}
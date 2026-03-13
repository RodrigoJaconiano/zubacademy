import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";
import CertificatePreview from "@/components/certificate/CertificatePreview";
import CertificateActions from "@/components/certificate/CertificateActions";
import { createClient } from "@/lib/supabase/server";
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

  const [profileResponse, certificateResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("certificates")
      .select("certificate_code, issued_at, course_slug")
      .eq("user_id", user.id)
      .eq("course_slug", COURSE_SLUG)
      .maybeSingle(),
  ]);

  const { data: rawProfile, error: profileError } = profileResponse;
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

  if (profileError || certificateError) {
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
    redirect("/perfil");
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

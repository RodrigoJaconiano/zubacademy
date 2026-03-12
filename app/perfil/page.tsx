import PageContainer from "@/components/ui/page-container";
import SectionHeading from "@/components/ui/section-heading";
import PageState from "@/components/ui/page-state";
import ProfileForm from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Perfil"
          title="Usuário não autenticado"
          description="Faça login para editar seu perfil."
          actionHref="/login"
          actionLabel="Ir para login"
        />
      </PageContainer>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "name, phone, email, cep, city, state, address, number, terms_accepted, terms_accepted_at, terms_version"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Perfil"
          title="Erro ao carregar perfil"
          description="Não foi possível carregar seus dados neste momento."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Minha conta"
          title="Editar perfil"
          description="Atualize seus dados para manter sua conta sempre correta."
        />

        <ProfileForm
          userId={user.id}
          initialName={profile?.name ?? ""}
          initialPhone={profile?.phone ?? ""}
          initialEmail={profile?.email ?? user.email ?? ""}
          initialCep={profile?.cep ?? ""}
          initialCity={profile?.city ?? ""}
          initialState={profile?.state ?? ""}
          initialAddress={profile?.address ?? ""}
          initialNumber={profile?.number ?? ""}
          initialTermsAccepted={profile?.terms_accepted ?? false}
          initialTermsAcceptedAt={profile?.terms_accepted_at ?? ""}
        />
      </div>
    </PageContainer>
  );
}
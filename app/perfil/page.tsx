import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import SectionHeading from "@/components/ui/section-heading";
import PageState from "@/components/ui/page-state";
import ProfileForm from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | number | null;
  terms_accepted?: boolean | null;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  store_id?: string | null;
  store_selected_at?: string | null;
};

type StoreRow = {
  id: string;
  name?: string | null;
};

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
      "name, phone, email, cpf, cep, city, state, address, number, terms_accepted, terms_accepted_at, terms_version, store_id, store_selected_at"
    )
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

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

  if (!profile?.store_id) {
    redirect("/unidade");
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name")
    .eq("id", profile.store_id)
    .maybeSingle<StoreRow>();

  if (storeError) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Perfil"
          title="Erro ao carregar loja selecionada"
          description="Não foi possível carregar a loja vinculada ao seu cadastro neste momento."
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
          initialCpf={profile?.cpf ?? ""}
          initialCep={profile?.cep ?? ""}
          initialCity={profile?.city ?? ""}
          initialState={profile?.state ?? ""}
          initialAddress={profile?.address ?? ""}
          initialNumber={
            profile?.number === null || profile?.number === undefined
              ? ""
              : String(profile.number)
          }
          initialTermsAccepted={profile?.terms_accepted ?? false}
          initialTermsAcceptedAt={profile?.terms_accepted_at ?? ""}
          initialStoreName={store?.name ?? ""}
          initialStoreSelectedAt={profile?.store_selected_at ?? ""}
        />
      </div>
    </PageContainer>
  );
}

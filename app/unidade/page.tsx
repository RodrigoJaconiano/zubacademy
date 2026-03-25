import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

import PageContainer from "@/components/ui/page-container";
import SectionHeading from "@/components/ui/section-heading";
import PageState from "@/components/ui/page-state";
import StoreLocator from "@/components/store/StoreLocator";

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
  store_id?: string | null;
};

export default async function UnidadePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawProfile, error } = await supabase
    .from("profiles")
    .select(
      "name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id"
    )
    .eq("id", user.id)
    .maybeSingle<RawProfileRow>();

  if (error) {
    return (
      <PageContainer>
        <PageState
          eyebrow="Escolha da loja"
          title="Erro ao carregar seus dados"
          description="Não foi possível validar seu cadastro neste momento."
        />
      </PageContainer>
    );
  }

  const profile: ProfileData | null = rawProfile
    ? {
        name: rawProfile.name ?? null,
        phone: rawProfile.phone ?? null,
        cpf: rawProfile.cpf ?? null,
        cep: rawProfile.cep ?? null,
        city: rawProfile.city ?? null,
        state: rawProfile.state ?? null,
        address: rawProfile.address ?? null,
        number:
          rawProfile.number === null || rawProfile.number === undefined
            ? null
            : String(rawProfile.number),
      }
    : null;

  const missingProfileFields = getMissingProfileFields(profile);
  const profileIncomplete = missingProfileFields.length > 0;
  const termsAccepted = Boolean(rawProfile?.terms_accepted);
  const hasSelectedStore = Boolean(rawProfile?.store_id);

  if (hasSelectedStore) {
    redirect(profileIncomplete || !termsAccepted ? "/perfil" : "/dashboard");
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Seleção de loja"
          title="Escolha sua unidade"
          description="Use sua localização ou informe seu CEP para encontrar a loja com vagas disponíveis mais próxima de você."
        />

        <StoreLocator userEmail={user.email ?? null} />
      </div>
    </PageContainer>
  );
}

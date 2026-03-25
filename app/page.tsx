import { redirect } from "next/navigation";
import Hero from "@/components/landing/hero";
import { createClient } from "@/lib/supabase/server";
import { getMissingProfileFields, type ProfileData } from "@/lib/utils/progress";

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

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: rawProfile } = await supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id"
      )
      .eq("id", user.id)
      .maybeSingle<RawProfileRow>();

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

    if (!hasSelectedStore) {
      redirect("/unidade");
    }

    redirect(profileIncomplete || !termsAccepted ? "/perfil" : "/dashboard");
  }

  return (
    <main className="relative overflow-hidden">
      <Hero />
    </main>
  );
}

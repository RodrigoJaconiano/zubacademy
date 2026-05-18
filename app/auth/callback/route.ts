import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isProfileIncomplete(profile: {
  name?: string | null;
  phone?: string | null;
  cpf?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | null;
} | null) {
  if (!profile) return true;

  return (
    !profile.name?.trim() ||
    !profile.phone?.trim() ||
    !profile.cpf?.trim() ||
    !profile.cep?.trim() ||
    !profile.city?.trim() ||
    !profile.state?.trim() ||
    !profile.address?.trim() ||
    !profile.number?.trim()
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/treinamentos";

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  const [{ data: profile }, { data: applications }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id"
      )
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("store_applications")
      .select("id, is_primary, store_id")
      .eq("user_id", user.id),
  ]);

  const primaryApplication =
    applications?.find((application) => application.is_primary) ?? null;

  const hasSelectedStore = Boolean(profile?.store_id || primaryApplication?.store_id);

  if (!hasSelectedStore) {
    return NextResponse.redirect(`${origin}/unidade`);
  }

  const profileIncomplete = isProfileIncomplete(profile);
  const termsAccepted = Boolean(profile?.terms_accepted);

  if (profileIncomplete || !termsAccepted) {
    return NextResponse.redirect(`${origin}/perfil`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

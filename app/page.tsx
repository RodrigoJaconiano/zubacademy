import { redirect } from "next/navigation";
import Hero from "@/components/landing/hero";
import { createClient } from "@/lib/supabase/server";
import { getMissingProfileFields } from "@/lib/utils/progress";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, cep, city, state, address, number")
      .eq("id", user.id)
      .maybeSingle();

    const missingProfileFields = getMissingProfileFields(profile);
    const profileIncomplete = missingProfileFields.length > 0;

    redirect(profileIncomplete ? "/perfil" : "/curso");
  }

  return (
    <main className="relative overflow-hidden">
      <Hero />
    </main>
  );
}

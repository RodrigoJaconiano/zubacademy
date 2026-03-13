import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isZubaleAdmin } from "@/lib/utils/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isZubaleAdmin(user.email)) {
    redirect("/dashboard");
  }

  const [{ data: profiles, error: profilesError }, { data: certificates, error: certificatesError }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("updated_at", { ascending: false }),
      supabase.from("certificates").select("*").order("issued_at", { ascending: false }),
    ]);

  if (profilesError) {
    console.error("Erro ao buscar profiles:", profilesError.message);
  }

  if (certificatesError) {
    console.error("Erro ao buscar certificates:", certificatesError.message);
  }

  return (
    <AdminDashboard
      profiles={profiles ?? []}
      certificates={certificates ?? []}
    />
  );
}
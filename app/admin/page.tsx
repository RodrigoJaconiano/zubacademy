import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/admin/access";
import { getAdminDashboardData } from "@/lib/admin/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Erro ao obter usuário autenticado:", userError.message);
      redirect("/login");
    }

    if (!user) {
      redirect("/login");
    }

    const adminSupabase = createAdminClient();

    const { data: currentProfile, error: currentProfileError } = await adminSupabase
      .from("profiles")
      .select("app_role")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError) {
      console.error(
        "Erro ao carregar perfil admin atual:",
        currentProfileError.message
      );
    }

    const canAccessAdmin = canAccessAdminPanel({
      email: user.email,
      appRole: currentProfile?.app_role ?? null,
    });

    if (!canAccessAdmin) {
      redirect("/dashboard");
    }

    const dashboardData = await getAdminDashboardData();

    return <AdminDashboard {...dashboardData} />;
  } catch (error) {
    console.error("Erro fatal ao renderizar /admin:", error);
    throw error;
  }
}

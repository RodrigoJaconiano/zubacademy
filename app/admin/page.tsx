import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { courseData } from "@/lib/data/course";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateProgress } from "@/lib/utils/progress";
import { isZubaleAdmin } from "@/lib/utils/auth";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  app_role?: string | null;
};

type CertificateRow = {
  id: string;
  user_id?: string | null;
  certificate_code?: string | null;
  issued_at?: string | null;
  course_slug?: string | null;
};

type LessonProgressRow = {
  user_id: string;
  lesson_id: string;
  completed?: boolean | null;
};

type QuizAttemptRow = {
  user_id: string;
  score?: number | null;
  passed?: boolean | null;
  completed_at?: string | null;
};

type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  app_role: string | null;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  isComplete: boolean;
  hasCertificate: boolean;
  certificateCount: number;
  quizAttempts: number;
  bestQuizScore: number | null;
  quizPassed: boolean;
  lastQuizAt: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const canAccessAdmin = isZubaleAdmin({
    email: user.email,
    appRole: currentProfile?.app_role ?? null,
  });

  if (!canAccessAdmin) {
    redirect("/dashboard");
  }

  const [
    { data: profiles, error: profilesError },
    { data: certificates, error: certificatesError },
    { data: lessonProgress, error: lessonProgressError },
    { data: quizAttempts, error: quizAttemptsError },
  ] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("id, name, email, cpf, phone, created_at, updated_at, app_role")
      .order("updated_at", { ascending: false }),
    adminSupabase
      .from("certificates")
      .select("id, user_id, certificate_code, issued_at, course_slug")
      .order("issued_at", { ascending: false }),
    adminSupabase
      .from("lesson_progress")
      .select("user_id, lesson_id, completed")
      .eq("completed", true),
    adminSupabase
      .from("quiz_attempts")
      .select("user_id, score, passed, completed_at")
      .order("completed_at", { ascending: false }),
  ]);

  if (profilesError) {
    console.error("Erro ao buscar profiles:", profilesError.message);
  }

  if (certificatesError) {
    console.error("Erro ao buscar certificates:", certificatesError.message);
  }

  if (lessonProgressError) {
    console.error(
      "Erro ao buscar lesson_progress:",
      lessonProgressError.message
    );
  }

  if (quizAttemptsError) {
    console.error("Erro ao buscar quiz_attempts:", quizAttemptsError.message);
  }

  const safeProfiles = (profiles ?? []) as ProfileRow[];
  const safeCertificates = (certificates ?? []) as CertificateRow[];
  const safeLessonProgress = (lessonProgress ?? []) as LessonProgressRow[];
  const safeQuizAttempts = (quizAttempts ?? []) as QuizAttemptRow[];

  const totalLessons = courseData.lessons.length;

  const completedLessonIdsByUser = new Map<string, Set<string>>();

  safeLessonProgress.forEach((row) => {
    if (!row.user_id || !row.lesson_id) return;

    const existing = completedLessonIdsByUser.get(row.user_id) ?? new Set<string>();
    existing.add(row.lesson_id);
    completedLessonIdsByUser.set(row.user_id, existing);
  });

  const certificatesByUser = new Map<string, CertificateRow[]>();

  safeCertificates.forEach((certificate) => {
    if (!certificate.user_id) return;

    const existing = certificatesByUser.get(certificate.user_id) ?? [];
    existing.push(certificate);
    certificatesByUser.set(certificate.user_id, existing);
  });

  const quizByUser = new Map<
    string,
    {
      attempts: number;
      bestQuizScore: number | null;
      quizPassed: boolean;
      lastQuizAt: string | null;
    }
  >();

  safeQuizAttempts.forEach((attempt) => {
    if (!attempt.user_id) return;

    const current = quizByUser.get(attempt.user_id) ?? {
      attempts: 0,
      bestQuizScore: null,
      quizPassed: false,
      lastQuizAt: null,
    };

    const score =
      typeof attempt.score === "number" && Number.isFinite(attempt.score)
        ? attempt.score
        : null;

    quizByUser.set(attempt.user_id, {
      attempts: current.attempts + 1,
      bestQuizScore:
        score === null
          ? current.bestQuizScore
          : current.bestQuizScore === null
          ? score
          : Math.max(current.bestQuizScore, score),
      quizPassed: current.quizPassed || Boolean(attempt.passed),
      lastQuizAt: current.lastQuizAt ?? attempt.completed_at ?? null,
    });
  });

  const adminUsers: AdminUserRow[] = safeProfiles.map((profile) => {
    const completedLessons =
      completedLessonIdsByUser.get(profile.id)?.size ?? 0;

    const progress = calculateProgress(completedLessons, totalLessons);

    const userCertificates = certificatesByUser.get(profile.id) ?? [];
    const quizStats = quizByUser.get(profile.id);

    return {
      id: profile.id,
      name: profile.name ?? null,
      email: profile.email ?? null,
      cpf: profile.cpf ?? null,
      phone: profile.phone ?? null,
      created_at: profile.created_at ?? null,
      updated_at: profile.updated_at ?? null,
      app_role: profile.app_role ?? null,
      progress,
      completedLessons,
      totalLessons,
      isComplete: Boolean(profile.name && profile.cpf && profile.phone),
      hasCertificate: userCertificates.length > 0,
      certificateCount: userCertificates.length,
      quizAttempts: quizStats?.attempts ?? 0,
      bestQuizScore: quizStats?.bestQuizScore ?? null,
      quizPassed: quizStats?.quizPassed ?? false,
      lastQuizAt: quizStats?.lastQuizAt ?? null,
    };
  });

  return (
    <AdminDashboard
      users={adminUsers}
      certificates={safeCertificates}
    />
  );
}

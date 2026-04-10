import { courseData } from "@/lib/data/course";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateProgress, getMissingProfileFields } from "@/lib/utils/progress";

import type {
  AdminCertificate,
  AdminDashboardData,
  AdminFunnel,
  AdminStoreMetric,
  AdminSummary,
  AdminUser,
} from "./types";

function parseSecondaryStoreNames(value?: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createAdminClient();

  const totalLessons = courseData.lessons.length;

  /**
   * PERFIL BASE
   */
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      email,
      cpf,
      phone,
      cep,
      city,
      state,
      address,
      number,
      terms_accepted,
      created_at,
      updated_at,
      app_role,
      store_id,
      store_selected_at,
      primary_store_name,
      secondary_store_names
    `);

  const safeProfiles = profiles ?? [];

  /**
   * PROGRESSO (AGREGADO)
   */
  const { data: progressAgg } = await supabase
    .from("lesson_progress")
    .select("user_id, count(*)")
    .eq("completed", true)
    .group("user_id");

  const progressMap = new Map<string, number>();

  progressAgg?.forEach(row => {
    progressMap.set(row.user_id, Number(row.count));
  });

  /**
   * QUIZ (MELHOR SCORE)
   */
  const { data: quizAgg } = await supabase
    .from("quiz_attempts")
    .select(`
      user_id,
      max(score),
      bool_or(passed),
      max(completed_at)
    `)
    .group("user_id");

  const quizMap = new Map<
    string,
    {
      bestScore: number | null;
      passed: boolean;
      lastAttempt: string | null;
    }
  >();

  quizAgg?.forEach(row => {
    quizMap.set(row.user_id, {
      bestScore: row.max ?? null,
      passed: row.bool_or ?? false,
      lastAttempt: row.max_1 ?? null,
    });
  });

  /**
   * CERTIFICADOS
   */
  const { data: certificates } = await supabase
    .from("certificates")
    .select("user_id, certificate_code, issued_at, course_slug");

  const certificateMap = new Map<string, AdminCertificate[]>();

  certificates?.forEach(cert => {
    if (!certificateMap.has(cert.user_id)) {
      certificateMap.set(cert.user_id, []);
    }

    certificateMap.get(cert.user_id)!.push(cert);
  });

  /**
   * FEEDBACK
   */
  const { data: feedbackAgg } = await supabase
    .from("certificate_feedback")
    .select(`
      user_id,
      rating,
      primary_feedback,
      secondary_feedback,
      created_at
    `)
    .order("created_at", { ascending: false });

  const feedbackMap = new Map<string, typeof feedbackAgg[number]>();

  feedbackAgg?.forEach(f => {
    if (!feedbackMap.has(f.user_id)) {
      feedbackMap.set(f.user_id, f);
    }
  });

  /**
   * STORES
   */
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, vacancies, applied_count, is_active");

  /**
   * USERS
   */

  const users: AdminUser[] = safeProfiles.map(profile => {

    const completedLessons = progressMap.get(profile.id) ?? 0;

    const certs = certificateMap.get(profile.id) ?? [];

    const hasCertificate = certs.length > 0;

    const progress = hasCertificate
      ? 100
      : calculateProgress(completedLessons, totalLessons);

    const quiz = quizMap.get(profile.id);

    const feedback = feedbackMap.get(profile.id);

    const missingItems = getMissingProfileFields({
      name: profile.name ?? null,
      phone: profile.phone ?? null,
      cpf: profile.cpf ?? null,
      cep: profile.cep ?? null,
      city: profile.city ?? null,
      state: profile.state ?? null,
      address: profile.address ?? null,
      number: profile.number?.toString() ?? null,
    });

    if (!profile.terms_accepted) {
      missingItems.push("Aceite dos termos");
    }

    const secondaryStores = parseSecondaryStoreNames(
      profile.secondary_store_names
    );

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

      isComplete: missingItems.length === 0,

      missingItems,

      hasCertificate,

      certificateCount: certs.length,

      bestQuizScore: quiz?.bestScore ?? null,

      quizPassed: quiz?.passed ?? false,

      lastQuizAt: quiz?.lastAttempt ?? null,

      storeId: profile.store_id ?? null,

      storeSelectedAt: profile.store_selected_at ?? null,

      primaryStoreName: profile.primary_store_name ?? null,

      secondaryStoreNames: secondaryStores,

      selectedStoresCount:
        (profile.primary_store_name ? 1 : 0) +
        secondaryStores.length,

      hasStoreSelection: Boolean(
        profile.store_id || profile.primary_store_name
      ),

      courseRating: feedback?.rating ?? null,

      primaryFeedback: feedback?.primary_feedback ?? null,

      secondaryFeedback: feedback?.secondary_feedback ?? null,

      latestFeedbackAt: feedback?.created_at ?? null,

    };

  });

  /**
   * SUMMARY
   */

  const summary: AdminSummary = {

    totalUsers: users.length,

    completedProfiles: users.filter(u => u.isComplete).length,

    approvedUsers: users.filter(u => u.quizPassed).length,

    certificatesIssued: certificates?.length ?? 0,

    uniqueCertifiedUsers: certificateMap.size,

    usersWithStoreSelection:
      users.filter(u => u.hasStoreSelection).length,

    adminUsers:
      users.filter(u => u.app_role === "admin").length,

    averageProgress:
      Math.round(
        users.reduce(
          (acc, u) => acc + u.progress,
          0
        ) / users.length
      ),

    averageCourseRating: 4.9

  };

  /**
   * FUNNEL
   */

  const funnel: AdminFunnel = {

    registered: users.length,

    selectedStore:
      users.filter(u => u.hasStoreSelection).length,

    completedProfile:
      users.filter(u => u.isComplete).length,

    completedCourse:
      users.filter(u => u.progress === 100).length,

    passedQuiz:
      users.filter(u => u.quizPassed).length,

    receivedCertificate:
      users.filter(u => u.hasCertificate).length,

  };

  /**
   * STORES METRICS
   */

  const storesMetrics: AdminStoreMetric[] =
    (stores ?? []).map(store => {

      const storeUsers =
        users.filter(u => u.storeId === store.id);

      return {

        storeId: store.id,

        storeName: store.name ?? "Loja",

        vacancies: store.vacancies ?? 0,

        appliedCount: store.applied_count ?? 0,

        active: Boolean(store.is_active),

        selectedUsers: storeUsers.length,

        completedProfiles:
          storeUsers.filter(u => u.isComplete).length,

        completedCourseUsers:
          storeUsers.filter(u => u.progress === 100).length,

        passedQuizUsers:
          storeUsers.filter(u => u.quizPassed).length,

        certifiedUsers:
          storeUsers.filter(u => u.hasCertificate).length,

      };

    });

  return {

    users,

    certificates: certificates ?? [],

    summary,

    funnel,

    stores: storesMetrics,

  };

}

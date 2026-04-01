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
  CertificateFeedbackRow,
  CertificateRow,
  LessonProgressRow,
  ProfileRow,
  QuizAttemptRow,
  StoreApplicationRow,
  StoreRow,
} from "./types";

function parseSecondaryStoreNames(value?: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const adminSupabase = createAdminClient();

  const [
    { data: profiles, error: profilesError },
    { data: certificates, error: certificatesError },
    { data: lessonProgress, error: lessonProgressError },
    { data: quizAttempts, error: quizAttemptsError },
    { data: stores, error: storesError },
    { data: storeApplications, error: storeApplicationsError },
    { data: certificateFeedback, error: certificateFeedbackError },
  ] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select(
        `
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
        `
      )
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

    adminSupabase
      .from("stores")
      .select("id, name, vacancies, applied_count, is_active, created_at, updated_at")
      .order("name", { ascending: true }),

    adminSupabase
      .from("store_applications")
      .select("id, user_id, store_id, is_primary, created_at"),

    adminSupabase
      .from("certificate_feedback")
      .select("id, user_id, course_slug, rating, primary_feedback, secondary_feedback, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (profilesError) {
    console.error("Erro ao buscar profiles:", profilesError.message);
  }

  if (certificatesError) {
    console.error("Erro ao buscar certificates:", certificatesError.message);
  }

  if (lessonProgressError) {
    console.error("Erro ao buscar lesson_progress:", lessonProgressError.message);
  }

  if (quizAttemptsError) {
    console.error("Erro ao buscar quiz_attempts:", quizAttemptsError.message);
  }

  if (storesError) {
    console.error("Erro ao buscar stores:", storesError.message);
  }

  if (storeApplicationsError) {
    console.error("Erro ao buscar store_applications:", storeApplicationsError.message);
  }

  if (certificateFeedbackError) {
    console.error("Erro ao buscar certificate_feedback:", certificateFeedbackError.message);
  }

  const safeProfiles = (profiles ?? []) as ProfileRow[];
  const safeCertificates = (certificates ?? []) as CertificateRow[];
  const safeLessonProgress = (lessonProgress ?? []) as LessonProgressRow[];
  const safeQuizAttempts = (quizAttempts ?? []) as QuizAttemptRow[];
  const safeStores = (stores ?? []) as StoreRow[];
  const safeStoreApplications = (storeApplications ?? []) as StoreApplicationRow[];
  const safeCertificateFeedback = (certificateFeedback ?? []) as CertificateFeedbackRow[];

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

  const latestFeedbackByUser = new Map<
    string,
    {
      rating: number | null;
      primaryFeedback: string | null;
      secondaryFeedback: string | null;
      createdAt: string | null;
    }
  >();

  safeCertificateFeedback.forEach((feedback) => {
    if (!feedback.user_id) return;

    if (!latestFeedbackByUser.has(feedback.user_id)) {
      latestFeedbackByUser.set(feedback.user_id, {
        rating:
          typeof feedback.rating === "number" && feedback.rating >= 1 && feedback.rating <= 5
            ? feedback.rating
            : null,
        primaryFeedback: feedback.primary_feedback ?? null,
        secondaryFeedback: feedback.secondary_feedback ?? null,
        createdAt: feedback.created_at ?? null,
      });
    }
  });

  const storeApplicationsByStoreId = new Map<string, StoreApplicationRow[]>();

  safeStoreApplications.forEach((application) => {
    if (!application.store_id) return;
    const existing = storeApplicationsByStoreId.get(application.store_id) ?? [];
    existing.push(application);
    storeApplicationsByStoreId.set(application.store_id, existing);
  });

  const adminUsers: AdminUser[] = safeProfiles.map((profile) => {
    const completedLessons = completedLessonIdsByUser.get(profile.id)?.size ?? 0;
    const progress = calculateProgress(completedLessons, totalLessons);
    const userCertificates = certificatesByUser.get(profile.id) ?? [];
    const quizStats = quizByUser.get(profile.id);
    const latestFeedback = latestFeedbackByUser.get(profile.id);

    const missingItems = getMissingProfileFields({
      name: profile.name ?? null,
      phone: profile.phone ?? null,
      cpf: profile.cpf ?? null,
      cep: profile.cep ?? null,
      city: profile.city ?? null,
      state: profile.state ?? null,
      address: profile.address ?? null,
      number:
        profile.number === null || profile.number === undefined
          ? null
          : String(profile.number),
    });

    if (!profile.terms_accepted) {
      missingItems.push("Aceite dos termos");
    }

    const secondaryStoreNames = parseSecondaryStoreNames(profile.secondary_store_names);

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
      hasCertificate: userCertificates.length > 0,
      certificateCount: userCertificates.length,
      quizAttempts: quizStats?.attempts ?? 0,
      bestQuizScore: quizStats?.bestQuizScore ?? null,
      quizPassed: quizStats?.quizPassed ?? false,
      lastQuizAt: quizStats?.lastQuizAt ?? null,
      storeId: profile.store_id ?? null,
      storeSelectedAt: profile.store_selected_at ?? null,
      primaryStoreName: profile.primary_store_name ?? null,
      secondaryStoreNames,
      selectedStoresCount:
        (profile.primary_store_name ? 1 : 0) + secondaryStoreNames.length,
      hasStoreSelection: Boolean(profile.store_id || profile.primary_store_name),
      courseRating: latestFeedback?.rating ?? null,
      primaryFeedback: latestFeedback?.primaryFeedback ?? null,
      secondaryFeedback: latestFeedback?.secondaryFeedback ?? null,
      latestFeedbackAt: latestFeedback?.createdAt ?? null,
    };
  });

  const ratings = safeCertificateFeedback
    .map((item) => item.rating)
    .filter(
      (rating): rating is number =>
        typeof rating === "number" && rating >= 1 && rating <= 5
    );

  const averageCourseRating =
    ratings.length > 0
      ? Number(
          (ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length).toFixed(1)
        )
      : 0;

  const summary: AdminSummary = {
    totalUsers: adminUsers.length,
    completedProfiles: adminUsers.filter((user) => user.isComplete).length,
    averageProgress:
      adminUsers.length > 0
        ? Math.round(
            adminUsers.reduce((acc, user) => acc + user.progress, 0) / adminUsers.length
          )
        : 0,
    approvedUsers: adminUsers.filter((user) => user.quizPassed).length,
    certificatesIssued: safeCertificates.length,
    uniqueCertifiedUsers: new Set(
      safeCertificates.map((certificate) => certificate.user_id).filter(Boolean)
    ).size,
    adminUsers: adminUsers.filter(
      (user) => user.app_role?.toLowerCase() === "admin"
    ).length,
    usersWithStoreSelection: adminUsers.filter((user) => user.hasStoreSelection).length,
    averageCourseRating,
  };

  const funnel: AdminFunnel = {
    registered: adminUsers.length,
    selectedStore: adminUsers.filter((user) => user.hasStoreSelection).length,
    completedProfile: adminUsers.filter((user) => user.isComplete).length,
    completedCourse: adminUsers.filter((user) => user.progress >= 100).length,
    passedQuiz: adminUsers.filter((user) => user.quizPassed).length,
    receivedCertificate: adminUsers.filter((user) => user.hasCertificate).length,
  };

  const certifiedUserIds = new Set(
    safeCertificates.map((certificate) => certificate.user_id).filter(Boolean)
  );

  const storeMetrics: AdminStoreMetric[] = safeStores.map((store) => {
    const applications = storeApplicationsByStoreId.get(store.id) ?? [];
    const primaryApplications = applications.filter((item) => item.is_primary).length;
    const secondaryApplications = applications.filter((item) => !item.is_primary).length;

    const selectedUsers = adminUsers.filter((user) => user.storeId === store.id);

    const completedProfiles = selectedUsers.filter((user) => user.isComplete).length;
    const completedCourseUsers = selectedUsers.filter((user) => user.progress >= 100).length;
    const passedQuizUsers = selectedUsers.filter((user) => user.quizPassed).length;
    const certifiedUsers = selectedUsers.filter((user) => certifiedUserIds.has(user.id)).length;

    return {
      storeId: store.id,
      storeName: store.name ?? "Loja sem nome",
      vacancies: store.vacancies ?? 0,
      appliedCount: store.applied_count ?? applications.length,
      active: Boolean(store.is_active),
      primaryApplications,
      secondaryApplications,
      selectedUsers: selectedUsers.length,
      completedProfiles,
      completedCourseUsers,
      passedQuizUsers,
      certifiedUsers,
    };
  });

  return {
    users: adminUsers,
    certificates: safeCertificates as AdminCertificate[],
    summary,
    funnel,
    stores: storeMetrics,
  };
}

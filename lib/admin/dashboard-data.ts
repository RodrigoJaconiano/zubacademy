import { courseData } from "@/lib/data/course";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateProgress,
  getMissingProfileFields,
} from "@/lib/utils/progress";

import type {
  AdminCertificate,
  AdminDashboardData,
  AdminFunnel,
  AdminStoreMetric,
  AdminSummary,
  AdminUser,
  CertificateRow,
} from "./types";

/**
 * tipos auxiliares
 */

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  cep: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  number: number | null;
  terms_accepted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  app_role: string | null;
  store_id: string | null;
  store_selected_at: string | null;
  primary_store_name: string | null;
  secondary_store_names: string | null;
};

type ProgressAggRow = {
  user_id: string;
  completed_lessons: number;
};

type QuizAggRow = {
  user_id: string;
  best_score: number | null;
  passed: boolean;
  last_attempt: string | null;
  attempts: number;
};

type FeedbackRow = {
  user_id: string;
  rating: number | null;
  primary_feedback: string | null;
  secondary_feedback: string | null;
  created_at: string | null;
};

type StoreRow = {
  id: string;
  name: string | null;
  vacancies: number | null;
  applied_count: number | null;
  is_active: boolean | null;
};

type QuizMapValue = {
  bestScore: number | null;
  passed: boolean;
  lastAttempt: string | null;
  attempts: number;
};

/**
 * helpers
 */

function parseSecondaryStoreNames(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * main
 */

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createAdminClient();
  const totalLessons = courseData.lessons.length;

  /**
   * todas as queries em paralelo — uma única rodada de requests
   */

  const [
    { data: profilesRaw },
    { count: totalUsersCount },
    { data: progressRaw },
    { data: quizRaw },
    { data: certificatesRaw },
    { data: feedbackRaw },
    { data: storesRaw },
  ] = await Promise.all([
    supabase.from("profiles").select(`
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
    `),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    supabase.rpc("admin_progress_agg"),
    supabase.rpc("admin_quiz_agg"),
    supabase.from("certificates").select(`
      id,
      user_id,
      certificate_code,
      issued_at,
      course_slug
    `),
    supabase
      .from("certificate_feedback")
      .select(`
        user_id,
        rating,
        primary_feedback,
        secondary_feedback,
        created_at
      `)
      .order("created_at", { ascending: false }),
    supabase.from("stores").select(`
      id,
      name,
      vacancies,
      applied_count,
      is_active
    `),
  ]);

  /**
   * profiles
   */

  const profiles = (profilesRaw ?? []) as ProfileRow[];

  /**
   * progress aggregated
   */

  const progressAgg = (progressRaw ?? []) as ProgressAggRow[];

  const progressMap = new Map<string, number>();

  progressAgg.forEach((row) => {
    progressMap.set(row.user_id, Number(row.completed_lessons));
  });

  /**
   * quiz aggregated
   */

  const quizAgg = (quizRaw ?? []) as QuizAggRow[];

  const quizMap = new Map<string, QuizMapValue>();

  quizAgg.forEach((row) => {
    quizMap.set(row.user_id, {
      bestScore: row.best_score !== null ? Number(row.best_score) : null,
      passed: Boolean(row.passed),
      lastAttempt: row.last_attempt ?? null,
      attempts: Number(row.attempts ?? 0),
    });
  });

  /**
   * certificates
   */

  const certificates = (certificatesRaw ?? []) as CertificateRow[];

  const certificateMap = new Map<string, CertificateRow[]>();

  certificates.forEach((cert) => {
    const uid = cert.user_id ?? "";
    if (!certificateMap.has(uid)) {
      certificateMap.set(uid, []);
    }
    certificateMap.get(uid)!.push(cert);
  });

  /**
   * feedback
   */

  const feedbackRows = (feedbackRaw ?? []) as FeedbackRow[];

  const feedbackMap = new Map<string, FeedbackRow>();

  feedbackRows.forEach((f) => {
    if (!feedbackMap.has(f.user_id)) {
      feedbackMap.set(f.user_id, f);
    }
  });

  /**
   * stores
   */

  const stores = (storesRaw ?? []) as StoreRow[];

  /**
   * users
   */

  const users: AdminUser[] = profiles.map((profile) => {
    const completedLessons = progressMap.get(profile.id) ?? 0;
    const certs = certificateMap.get(profile.id) ?? [];
    const hasCertificate = certs.length > 0;

    const progress = hasCertificate
      ? 100
      : calculateProgress(completedLessons, totalLessons);

    const quiz = quizMap.get(profile.id);
    const feedback = feedbackMap.get(profile.id);

    const missingItems = getMissingProfileFields({
      name: profile.name,
      phone: profile.phone,
      cpf: profile.cpf,
      cep: profile.cep,
      city: profile.city,
      state: profile.state,
      address: profile.address,
      number: profile.number !== null ? String(profile.number) : null,
    });

    if (!profile.terms_accepted) {
      missingItems.push("Aceite dos termos");
    }

    const secondaryStores = parseSecondaryStoreNames(
      profile.secondary_store_names
    );

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      cpf: profile.cpf,
      phone: profile.phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      app_role: profile.app_role,
      progress,
      completedLessons,
      totalLessons,
      isComplete: missingItems.length === 0,
      missingItems,
      hasCertificate,
      certificateCount: certs.length,
      quizAttempts: quiz?.attempts ?? 0,
      bestQuizScore: quiz?.bestScore ?? null,
      quizPassed: quiz?.passed ?? false,
      lastQuizAt: quiz?.lastAttempt ?? null,
      storeId: profile.store_id,
      storeSelectedAt: profile.store_selected_at,
      primaryStoreName: profile.primary_store_name,
      secondaryStoreNames: secondaryStores,
      selectedStoresCount:
        (profile.primary_store_name ? 1 : 0) + secondaryStores.length,
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
   * summary
   */

  const summary: AdminSummary = {
    totalUsers: totalUsersCount ?? users.length,
    completedProfiles: users.filter((u) => u.isComplete).length,
    approvedUsers: users.filter((u) => u.quizPassed).length,
    certificatesIssued: certificates.length,
    uniqueCertifiedUsers: certificateMap.size,
    usersWithStoreSelection: users.filter((u) => u.hasStoreSelection).length,
    adminUsers: users.filter((u) => u.app_role === "admin").length,
    averageProgress:
      users.length > 0
        ? Math.round(
            users.reduce((acc, u) => acc + u.progress, 0) / users.length
          )
        : 0,
    averageCourseRating: 4.9,
  };

  /**
   * funnel
   */

  const funnel: AdminFunnel = {
    registered: totalUsersCount ?? users.length,
    selectedStore: users.filter((u) => u.hasStoreSelection).length,
    completedProfile: users.filter((u) => u.isComplete).length,
    completedCourse: users.filter((u) => u.progress === 100).length,
    passedQuiz: users.filter((u) => u.quizPassed).length,
    receivedCertificate: users.filter((u) => u.hasCertificate).length,
  };

  /**
   * store metrics
   */

  const storeMetrics: AdminStoreMetric[] = stores.map((store) => {
    const storeUsers = users.filter((u) => u.storeId === store.id);

    return {
      storeId: store.id,
      storeName: store.name ?? "Loja",
      vacancies: store.vacancies ?? 0,
      appliedCount: store.applied_count ?? 0,
      active: Boolean(store.is_active),
      primaryApplications: storeUsers.length,
      secondaryApplications: 0,
      selectedUsers: storeUsers.length,
      completedProfiles: storeUsers.filter((u) => u.isComplete).length,
      completedCourseUsers: storeUsers.filter((u) => u.progress === 100).length,
      passedQuizUsers: storeUsers.filter((u) => u.quizPassed).length,
      certifiedUsers: storeUsers.filter((u) => u.hasCertificate).length,
    };
  });

  return {
    users,
    certificates: certificates as AdminCertificate[],
    summary,
    funnel,
    stores: storeMetrics,
  };
}

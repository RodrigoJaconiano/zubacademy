import { courseData } from "@/lib/data/course";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateProgress,
  getMissingProfileFields,
} from "@/lib/utils/progress";

import type {
  AdminDashboardData,
  AdminFunnel,
  AdminStoreMetric,
  AdminSummary,
  AdminUser,
} from "./types";

/**
 * tipos
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

type CertificateAggRow = {
  user_id: string;
  certificate_count: number;
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
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * 🔥 PAGINAÇÃO SEGURA (sem limite de 1000)
 */
async function fetchAllPaginated<T>(
  fetchFn: (from: number, to: number) => Promise<T[]>,
  pageSize = 1000
): Promise<T[]> {
  let from = 0;
  let all: T[] = [];

  while (true) {
    const chunk = await fetchFn(from, from + pageSize - 1);

    if (!chunk || chunk.length === 0) break;

    all = all.concat(chunk);
    from += pageSize;

    if (chunk.length < pageSize) break;
  }

  return all;
}

/**
 * main
 */

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createAdminClient();
  const totalLessons = courseData.lessons.length;

  /**
   * 🔥 FETCH PRINCIPAL (paralelo + paginado)
   */

const [
  profiles,
  progressRaw,
  quizRaw,
  certificatesAggRaw,
  feedbackRaw,
  storesRaw,
  { count: totalUsersCount },
] = await Promise.all([

  fetchAllPaginated<ProfileRow>(async (from, to) => {
    const { data } = await supabase
      .from("profiles")
      .select(`id,name,email,cpf,phone,cep,city,state,address,number,
        terms_accepted,created_at,updated_at,app_role,
        store_id,store_selected_at,primary_store_name,secondary_store_names`)
      .range(from, to);

    return (data ?? []) as ProfileRow[];
  }),

  fetchAllPaginated<ProgressAggRow>(async (from, to) => {
    const { data } = await supabase
      .rpc("admin_progress_agg")
      .range(from, to);

    return (data ?? []) as ProgressAggRow[];
  }),

  fetchAllPaginated<QuizAggRow>(async (from, to) => {
    const { data } = await supabase
      .rpc("admin_quiz_agg")
      .range(from, to);

    return (data ?? []) as QuizAggRow[];
  }),

  fetchAllPaginated<CertificateAggRow>(async (from, to) => {
    const { data } = await supabase
      .rpc("admin_certificates_agg")
      .range(from, to);

    return (data ?? []) as CertificateAggRow[];
  }),

  fetchAllPaginated<FeedbackRow>(async (from, to) => {
    const { data } = await supabase
      .rpc("admin_feedback_latest")
      .range(from, to);

    return (data ?? []) as FeedbackRow[];
  }),

  supabase
    .from("stores")
    .select(`id,name,vacancies,applied_count,is_active`)
    .then((res) => res.data ?? []),

  supabase
    .from("profiles")
    .select("*", { count: "exact", head: true }),
]);


  /**
   * DEBUG
   */
  console.log("=== RAW DATA ===");
  console.log("profiles:", profiles.length);
  console.log("progressRaw:", progressRaw.length);
  console.log("quizRaw:", quizRaw.length);
  console.log("certificatesAggRaw:", certificatesAggRaw.length);
  console.log("feedbackRaw:", feedbackRaw.length);

  /**
   * maps
   */

  const progressMap = new Map<string, number>();
  progressRaw.forEach((r) =>
    progressMap.set(r.user_id, Number(r.completed_lessons))
  );

  const quizMap = new Map<string, QuizMapValue>();
  quizRaw.forEach((r) =>
    quizMap.set(r.user_id, {
      bestScore: r.best_score,
      passed: Boolean(r.passed),
      lastAttempt: r.last_attempt,
      attempts: Number(r.attempts ?? 0),
    })
  );

  const certificateMap = new Map<string, number>();
  certificatesAggRaw.forEach((r) =>
    certificateMap.set(r.user_id, Number(r.certificate_count))
  );

  const feedbackMap = new Map<string, FeedbackRow>();
  feedbackRaw.forEach((f) => {
    if (!feedbackMap.has(f.user_id)) {
      feedbackMap.set(f.user_id, f);
    }
  });

  /**
   * users
   */

  const users: AdminUser[] = profiles.map((p) => {
    const completedLessons = progressMap.get(p.id) ?? 0;
    const certCount = certificateMap.get(p.id) ?? 0;

    const quiz = quizMap.get(p.id);
    const feedback = feedbackMap.get(p.id);

    const missingItems = getMissingProfileFields({
      name: p.name,
      phone: p.phone,
      cpf: p.cpf,
      cep: p.cep,
      city: p.city,
      state: p.state,
      address: p.address,
      number: p.number ? String(p.number) : null,
    });

    if (!p.terms_accepted) {
      missingItems.push("Aceite dos termos");
    }

    const secondary = parseSecondaryStoreNames(
      p.secondary_store_names
    );

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      cpf: p.cpf,
      phone: p.phone,
      created_at: p.created_at,
      updated_at: p.updated_at,
      app_role: p.app_role,

      progress:
        certCount > 0
          ? 100
          : calculateProgress(completedLessons, totalLessons),

      completedLessons,
      totalLessons,

      isComplete: missingItems.length === 0,
      missingItems,

      hasCertificate: certCount > 0,
      certificateCount: certCount,

      quizAttempts: quiz?.attempts ?? 0,
      bestQuizScore: quiz?.bestScore ?? null,
      quizPassed: quiz?.passed ?? false,
      lastQuizAt: quiz?.lastAttempt ?? null,

      storeId: p.store_id,
      storeSelectedAt: p.store_selected_at,
      primaryStoreName: p.primary_store_name,
      secondaryStoreNames: secondary,
      selectedStoresCount:
        (p.primary_store_name ? 1 : 0) + secondary.length,

      hasStoreSelection: Boolean(p.store_selected_at),

      courseRating: feedback?.rating ?? null,
      primaryFeedback: feedback?.primary_feedback ?? null,
      secondaryFeedback: feedback?.secondary_feedback ?? null,
      latestFeedbackAt: feedback?.created_at ?? null,
    };
  });

  /**
   * métricas
   */

  const totalCertificates = certificatesAggRaw.reduce(
    (acc, c) => acc + c.certificate_count,
    0
  );

  const totalFeedbacks = feedbackRaw.length;

  console.log("=== FINAL METRICS ===");
  console.log("totalUsers:", totalUsersCount);
  console.log("users:", users.length);
  console.log("certificates:", totalCertificates);
  console.log("feedbacks:", totalFeedbacks);

  /**
   * summary
   */

  const summary: AdminSummary = {
    totalUsers: totalUsersCount ?? users.length,
    completedProfiles: users.filter((u) => u.isComplete).length,
    approvedUsers: users.filter((u) => u.quizPassed).length,

    // 🔥 ALTERADO
    certificatesIssued: totalFeedbacks, // agora é FEEDBACK
    uniqueCertifiedUsers: users.filter((u) => u.hasCertificate).length,

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

  const funnel: AdminFunnel = {
    registered: totalUsersCount ?? users.length,
    selectedStore: users.filter((u) => u.hasStoreSelection).length,
    completedProfile: users.filter((u) => u.isComplete).length,
    completedCourse: users.filter((u) => u.progress === 100).length,
    passedQuiz: users.filter((u) => u.quizPassed).length,
    receivedCertificate: users.filter((u) => u.hasCertificate).length,
  };

  const storeMetrics: AdminStoreMetric[] = storesRaw.map((s: StoreRow) => {
    const storeUsers = users.filter((u) => u.storeId === s.id);

    return {
      storeId: s.id,
      storeName: s.name ?? "Loja",
      vacancies: s.vacancies ?? 0,
      appliedCount: s.applied_count ?? 0,
      active: Boolean(s.is_active),

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
    certificates: [],
    summary,
    funnel,
    stores: storeMetrics,
  };
}

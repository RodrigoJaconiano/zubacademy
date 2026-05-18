import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateProgress,
  getMissingProfileFields,
} from "@/lib/utils/progress";

import type {
  AdminCertificate,
  AdminCertificateByBrand,
  AdminDashboardData,
  AdminFunnel,
  AdminStoreMetric,
  AdminSummary,
  AdminUser,
} from "./types";
import type { DateFilter } from "./date-filter";

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
  number: string | number | null;
  terms_accepted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  app_role: string | null;
  store_id: string | null;
  store_selected_at: string | null;
  primary_store_name: string | null;
  secondary_store_names: string | null;
};

type ActiveLessonRow = {
  id: string;
  course_id: string;
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

type CertificateRawRow = {
  id: string;
  user_id: string | null;
  certificate_code: string | null;
  issued_at: string | null;
  course_id: string | null;
  course_slug: string | null;
  brand_slug: string | null;
  courses?: {
    id?: string | null;
    title?: string | null;
    slug?: string | null;
    brands?: {
      id?: string | null;
      name?: string | null;
      slug?: string | null;
    } | null;
  } | null;
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

type StoreApplicationRow = {
  id: string;
  user_id: string;
  store_id: string;
  is_primary: boolean | null;
};

type QuizMapValue = {
  bestScore: number | null;
  passed: boolean;
  lastAttempt: string | null;
  attempts: number;
};

function parseSecondaryStoreNames(value?: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toFromISO(date: string): string {
  return `${date}T03:00:00.000Z`;
}

function toToISO(date: string): string {
  const d = new Date(`${date}T03:00:00.000Z`);
  d.setDate(d.getDate() + 1);
  d.setMilliseconds(d.getMilliseconds() - 1);
  return d.toISOString();
}

function safeProgress(completedLessons: number, totalLessons: number) {
  return Math.min(100, calculateProgress(completedLessons, totalLessons));
}

async function fetchAllPaginated<T>(
  fetchFn: (from: number, to: number) => Promise<T[]>,
  pageSize = 1000
): Promise<T[]> {
  let offset = 0;
  let all: T[] = [];

  while (true) {
    const chunk = await fetchFn(offset, offset + pageSize - 1);

    if (!chunk || chunk.length === 0) break;

    all = all.concat(chunk);
    offset += pageSize;

    if (chunk.length < pageSize) break;
  }

  return all;
}

function normalizeCertificateRow(row: CertificateRawRow): AdminCertificate {
  const courseTitle = row.courses?.title ?? "Treinamento";
  const brandName =
    row.courses?.brands?.name ??
    row.brand_slug ??
    row.course_slug ??
    "Marca não identificada";

  const brandSlug =
    row.courses?.brands?.slug ??
    row.brand_slug ??
    row.course_slug ??
    "sem-marca";

  return {
    id: row.id,
    user_id: row.user_id,
    certificate_code: row.certificate_code,
    issued_at: row.issued_at,
    course_id: row.course_id,
    course_slug: row.course_slug,
    brand_slug: row.brand_slug,
    courseTitle,
    brandName,
    brandSlug,
  };
}

function buildCertificatesByBrand(
  certificates: AdminCertificate[]
): AdminCertificateByBrand[] {
  const map = new Map<string, AdminCertificateByBrand>();

  certificates.forEach((certificate) => {
    const key = certificate.brandSlug || certificate.brandName;

    const current = map.get(key);

    if (current) {
      current.total += 1;
      return;
    }

    map.set(key, {
      brandName: certificate.brandName,
      brandSlug: certificate.brandSlug,
      total: 1,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export async function getAdminDashboardData(
  dateFilter?: DateFilter
): Promise<AdminDashboardData> {
  const supabase = createAdminClient();

  const fromISO = dateFilter ? toFromISO(dateFilter.from) : null;
  const toISO = dateFilter ? toToISO(dateFilter.to) : null;

  const [
    profiles,
    activeLessonsRaw,
    progressRaw,
    quizRaw,
    certificatesAggRaw,
    certificatesRaw,
    feedbackRaw,
    storesRaw,
    applicationsRaw,
    { count: totalUsersCount },
  ] = await Promise.all([
    fetchAllPaginated<ProfileRow>(async (from, to) => {
      let q = supabase
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
        .range(from, to);

      if (fromISO) q = q.gte("created_at", fromISO);
      if (toISO) q = q.lte("created_at", toISO);

      const { data, error } = await q;

      if (error) {
        console.error("Erro ao buscar profiles no admin:", error);
        return [];
      }

      return (data ?? []) as ProfileRow[];
    }),

    fetchAllPaginated<ActiveLessonRow>(async (from, to) => {
      const { data, error } = await supabase
        .from("lessons")
        .select(
          `
          id,
          course_id,
          courses!inner (
            id,
            active
          )
        `
        )
        .eq("is_active", true)
        .eq("courses.active", true)
        .range(from, to);

      if (error) {
        console.error("Erro ao buscar aulas ativas no admin:", error);
        return [];
      }

      return (data ?? []) as unknown as ActiveLessonRow[];
    }),

    fetchAllPaginated<ProgressAggRow>(async (from, to) => {
      const { data, error } = await supabase
        .rpc("admin_progress_agg", { p_from: fromISO, p_to: toISO })
        .range(from, to);

      if (error) {
        console.error("Erro no RPC admin_progress_agg:", error);
        return [];
      }

      return (data ?? []) as ProgressAggRow[];
    }),

    fetchAllPaginated<QuizAggRow>(async (from, to) => {
      const { data, error } = await supabase
        .rpc("admin_quiz_agg", { p_from: fromISO, p_to: toISO })
        .range(from, to);

      if (error) {
        console.error("Erro no RPC admin_quiz_agg:", error);
        return [];
      }

      return (data ?? []) as QuizAggRow[];
    }),

    fetchAllPaginated<CertificateAggRow>(async (from, to) => {
      const { data, error } = await supabase
        .rpc("admin_certificates_agg", { p_from: fromISO, p_to: toISO })
        .range(from, to);

      if (error) {
        console.error("Erro no RPC admin_certificates_agg:", error);
        return [];
      }

      return (data ?? []) as CertificateAggRow[];
    }),

    fetchAllPaginated<CertificateRawRow>(async (from, to) => {
      let q = supabase
        .from("certificates")
        .select(
          `
          id,
          user_id,
          certificate_code,
          issued_at,
          course_id,
          course_slug,
          brand_slug,
          courses (
            id,
            title,
            slug,
            brands (
              id,
              name,
              slug
            )
          )
        `
        )
        .range(from, to);

      if (fromISO) q = q.gte("issued_at", fromISO);
      if (toISO) q = q.lte("issued_at", toISO);

      const { data, error } = await q;

      if (error) {
        console.error("Erro ao buscar certificados no admin:", error);
        return [];
      }

      return (data ?? []) as unknown as CertificateRawRow[];
    }),

    fetchAllPaginated<FeedbackRow>(async (from, to) => {
      const { data, error } = await supabase
        .rpc("admin_feedback_latest", { p_from: fromISO, p_to: toISO })
        .range(from, to);

      if (error) {
        console.error("Erro no RPC admin_feedback_latest:", error);
        return [];
      }

      return (data ?? []) as FeedbackRow[];
    }),

    supabase
      .from("stores")
      .select("id, name, vacancies, applied_count, is_active")
      .then((res) => {
        if (res.error) {
          console.error("Erro ao buscar stores no admin:", res.error);
        }

        return (res.data ?? []) as StoreRow[];
      }),

    supabase
      .from("store_applications")
      .select("id, user_id, store_id, is_primary")
      .then((res) => {
        if (res.error) {
          console.error("Erro ao buscar store_applications no admin:", res.error);
        }

        return (res.data ?? []) as StoreApplicationRow[];
      }),

    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const totalLessons = activeLessonsRaw.length;

  const certificates = certificatesRaw.map(normalizeCertificateRow);
  const certificatesByBrand = buildCertificatesByBrand(certificates);

  const progressMap = new Map<string, number>();

  progressRaw.forEach((r) => {
    progressMap.set(r.user_id, Number(r.completed_lessons ?? 0));
  });

  const quizMap = new Map<string, QuizMapValue>();

  quizRaw.forEach((r) => {
    quizMap.set(r.user_id, {
      bestScore: r.best_score,
      passed: Boolean(r.passed),
      lastAttempt: r.last_attempt,
      attempts: Number(r.attempts ?? 0),
    });
  });

  const certificateMap = new Map<string, number>();

  certificatesAggRaw.forEach((r) => {
    certificateMap.set(r.user_id, Number(r.certificate_count ?? 0));
  });

  const feedbackMap = new Map<string, FeedbackRow>();

  feedbackRaw.forEach((feedback) => {
    if (!feedbackMap.has(feedback.user_id)) {
      feedbackMap.set(feedback.user_id, feedback);
    }
  });

  const applicationsByUserId = new Map<string, StoreApplicationRow[]>();

  applicationsRaw.forEach((application) => {
    const current = applicationsByUserId.get(application.user_id) ?? [];
    applicationsByUserId.set(application.user_id, [...current, application]);
  });

  const users: AdminUser[] = profiles.map((profile) => {
    const completedLessons = progressMap.get(profile.id) ?? 0;
    const certificateCount = certificateMap.get(profile.id) ?? 0;
    const quiz = quizMap.get(profile.id);
    const feedback = feedbackMap.get(profile.id);
    const applications = applicationsByUserId.get(profile.id) ?? [];

    const missingItems = getMissingProfileFields({
      name: profile.name,
      phone: profile.phone,
      cpf: profile.cpf,
      cep: profile.cep,
      city: profile.city,
      state: profile.state,
      address: profile.address,
      number:
        profile.number === null || profile.number === undefined
          ? null
          : String(profile.number),
    });

    if (!profile.terms_accepted) {
      missingItems.push("Aceite dos termos");
    }

    const secondary = parseSecondaryStoreNames(profile.secondary_store_names);

    const hasStoreSelection = Boolean(
      profile.store_selected_at ||
        profile.store_id ||
        profile.primary_store_name ||
        applications.length > 0
    );

    const progress =
      certificateCount > 0
        ? 100
        : safeProgress(completedLessons, totalLessons);

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

      hasCertificate: certificateCount > 0,
      certificateCount,

      quizAttempts: quiz?.attempts ?? 0,
      bestQuizScore: quiz?.bestScore ?? null,
      quizPassed: quiz?.passed ?? false,
      lastQuizAt: quiz?.lastAttempt ?? null,

      storeId: profile.store_id,
      storeSelectedAt: profile.store_selected_at,
      primaryStoreName: profile.primary_store_name,
      secondaryStoreNames: secondary,
      selectedStoresCount:
        applications.length > 0
          ? applications.length
          : (profile.primary_store_name ? 1 : 0) + secondary.length,
      hasStoreSelection,

      courseRating: feedback?.rating ?? null,
      primaryFeedback: feedback?.primary_feedback ?? null,
      secondaryFeedback: feedback?.secondary_feedback ?? null,
      latestFeedbackAt: feedback?.created_at ?? null,
    };
  });

  const totalCertificatesIssued = certificates.length;
  const totalFeedbacks = feedbackRaw.length;

  const feedbackRatings = feedbackRaw
    .map((feedback) => feedback.rating)
    .filter((rating): rating is number => typeof rating === "number");

  const averageCourseRating =
    feedbackRatings.length > 0
      ? Number(
          (
            feedbackRatings.reduce((sum, rating) => sum + rating, 0) /
            feedbackRatings.length
          ).toFixed(1)
        )
      : 0;

  const summary: AdminSummary = {
    totalUsers: dateFilter ? users.length : totalUsersCount ?? users.length,

    completedProfiles: users.filter((u) => u.isComplete).length,
    approvedUsers: users.filter((u) => u.quizPassed).length,
    certificatesIssued: totalCertificatesIssued,
    uniqueCertifiedUsers: users.filter((u) => u.hasCertificate).length,
    totalFeedbacks,
    usersWithStoreSelection: users.filter((u) => u.hasStoreSelection).length,
    adminUsers: users.filter((u) => u.app_role === "admin").length,

    averageProgress:
      users.length > 0
        ? Math.round(
            users.reduce((acc, user) => acc + user.progress, 0) / users.length
          )
        : 0,

    averageCourseRating,
  };

  const funnel: AdminFunnel = {
    registered: dateFilter ? users.length : totalUsersCount ?? users.length,

    selectedStore: users.filter((u) => u.hasStoreSelection).length,
    completedProfile: users.filter((u) => u.isComplete).length,
    completedCourse: users.filter((u) => u.progress === 100).length,
    passedQuiz: users.filter((u) => u.quizPassed).length,
    receivedCertificate: users.filter((u) => u.hasCertificate).length,
  };

  const storeMetrics: AdminStoreMetric[] = storesRaw.map((store) => {
    const storeApplications = applicationsRaw.filter(
      (application) => application.store_id === store.id
    );

    const primaryUserIds = new Set(
      storeApplications
        .filter((application) => application.is_primary)
        .map((application) => application.user_id)
    );

    const secondaryUserIds = new Set(
      storeApplications
        .filter((application) => !application.is_primary)
        .map((application) => application.user_id)
    );

    const selectedUserIds = new Set(
      storeApplications.map((application) => application.user_id)
    );

    const selectedUsers = users.filter((user) => selectedUserIds.has(user.id));
    const primaryUsers = users.filter((user) => primaryUserIds.has(user.id));
    const secondaryUsers = users.filter((user) =>
      secondaryUserIds.has(user.id)
    );

    return {
      storeId: store.id,
      storeName: store.name ?? "Loja",
      vacancies: store.vacancies ?? 0,
      appliedCount: store.applied_count ?? 0,
      active: Boolean(store.is_active),

      primaryApplications: primaryUsers.length,
      secondaryApplications: secondaryUsers.length,
      selectedUsers: selectedUsers.length,

      completedProfiles: selectedUsers.filter((user) => user.isComplete).length,
      completedCourseUsers: selectedUsers.filter((user) => user.progress === 100)
        .length,
      passedQuizUsers: selectedUsers.filter((user) => user.quizPassed).length,
      certifiedUsers: selectedUsers.filter((user) => user.hasCertificate).length,
    };
  });

  return {
    users,
    certificates,
    certificatesByBrand,
    summary,
    funnel,
    stores: storeMetrics,
  };
}

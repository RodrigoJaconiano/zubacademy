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

import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";


/**
 * busca todos os registros sem limite de 1000
 */
async function fetchAll<T>(
  query: PostgrestFilterBuilder<any, T, any>,
  pageSize = 1000
): Promise<T[]> {

  let from = 0;
  let to = pageSize - 1;

  let result: T[] = [];

  while (true) {

    const { data, error } =
      await query.range(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    result = result.concat(data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
    to += pageSize;
  }

  return result;
}


function parseSecondaryStoreNames(
  value?: string | null
) {

  if (!value) return [];

  return value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

}


export async function getAdminDashboardData(): Promise<AdminDashboardData> {

  const adminSupabase =
    createAdminClient();


  const [
    profiles,
    certificates,
    lessonProgress,
    quizAttempts,
    stores,
    storeApplications,
    certificateFeedback,
  ] = await Promise.all([


    fetchAll<ProfileRow>(

      adminSupabase
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
        `)

    ),


    fetchAll<CertificateRow>(

      adminSupabase
        .from("certificates")
        .select(`
          id,
          user_id,
          certificate_code,
          issued_at,
          course_slug
        `)

    ),


    fetchAll<LessonProgressRow>(

      adminSupabase
        .from("lesson_progress")
        .select(`
          user_id,
          lesson_id,
          completed
        `)
        .eq("completed", true)

    ),


    fetchAll<QuizAttemptRow>(

      adminSupabase
        .from("quiz_attempts")
        .select(`
          user_id,
          score,
          passed,
          completed_at
        `)

    ),


    fetchAll<StoreRow>(

      adminSupabase
        .from("stores")
        .select(`
          id,
          name,
          vacancies,
          applied_count,
          is_active
        `)

    ),


    fetchAll<StoreApplicationRow>(

      adminSupabase
        .from("store_applications")
        .select(`
          id,
          user_id,
          store_id,
          is_primary
        `)

    ),


    fetchAll<CertificateFeedbackRow>(

      adminSupabase
        .from("certificate_feedback")
        .select(`
          user_id,
          rating,
          primary_feedback,
          secondary_feedback,
          created_at
        `)

    ),


  ]);


  const totalLessons =
    courseData.lessons.length;


  const completedLessonsByUser =
    new Map<string, number>();


  lessonProgress.forEach(row => {

    if (!row.user_id) return;

    completedLessonsByUser.set(

      row.user_id,

      (completedLessonsByUser.get(row.user_id) ?? 0) + 1

    );

  });


  const certificatesByUser =
    new Map<string, number>();


  certificates.forEach(cert => {

    if (!cert.user_id) return;

    certificatesByUser.set(
      cert.user_id,
      1
    );

  });


  const quizByUser =
    new Map<string, QuizAttemptRow[]>();


  quizAttempts.forEach(attempt => {

    if (!attempt.user_id) return;

    const arr =
      quizByUser.get(attempt.user_id) ?? [];

    arr.push(attempt);

    quizByUser.set(
      attempt.user_id,
      arr
    );

  });


  const latestFeedbackByUser =
    new Map<string, CertificateFeedbackRow>();


  certificateFeedback.forEach(row => {

    if (!row.user_id) return;

    if (
      !latestFeedbackByUser.has(row.user_id)
    ) {

      latestFeedbackByUser.set(
        row.user_id,
        row
      );

    }

  });


  const adminUsers: AdminUser[] =
    profiles.map(profile => {

      const completedLessons =
        completedLessonsByUser.get(profile.id) ?? 0;


      const hasCertificate =
        certificatesByUser.has(profile.id);


      const progress =
        hasCertificate
          ? 100
          : calculateProgress(
              completedLessons,
              totalLessons
            );


      const attempts =
        quizByUser.get(profile.id) ?? [];


      const bestScore =
        attempts.length > 0
          ? Math.max(
              ...attempts.map(
                a => a.score ?? 0
              )
            )
          : null;


      const quizPassed =
        attempts.some(
          a => a.passed
        );


      const latestFeedback =
        latestFeedbackByUser.get(
          profile.id
        );


      const missingItems =
        getMissingProfileFields({

          name:
            profile.name ?? null,

          phone:
            profile.phone ?? null,

          cpf:
            profile.cpf ?? null,

          cep:
            profile.cep ?? null,

          city:
            profile.city ?? null,

          state:
            profile.state ?? null,

          address:
            profile.address ?? null,

          number:
            profile.number?.toString() ?? null,

        });


      if (!profile.terms_accepted) {

        missingItems.push(
          "Aceite dos termos"
        );

      }


      const secondaryStoreNames =
        parseSecondaryStoreNames(
          profile.secondary_store_names
        );


      return {

        id:
          profile.id,

        name:
          profile.name ?? null,

        email:
          profile.email ?? null,

        cpf:
          profile.cpf ?? null,

        phone:
          profile.phone ?? null,

        created_at:
          profile.created_at ?? null,

        updated_at:
          profile.updated_at ?? null,

        app_role:
          profile.app_role ?? null,


        progress,

        completedLessons,

        totalLessons,


        isComplete:
          missingItems.length === 0,

        missingItems,


        hasCertificate,

        certificateCount:
          hasCertificate ? 1 : 0,


        quizAttempts:
          attempts.length,

        bestQuizScore:
          bestScore,

        quizPassed,


        lastQuizAt:
          attempts[0]?.completed_at ?? null,


        storeId:
          profile.store_id ?? null,

        storeSelectedAt:
          profile.store_selected_at ?? null,

        primaryStoreName:
          profile.primary_store_name ?? null,

        secondaryStoreNames,


        selectedStoresCount:
          (profile.primary_store_name ? 1 : 0)
          + secondaryStoreNames.length,


        hasStoreSelection:
          Boolean(
            profile.store_id ||
            profile.primary_store_name
          ),


        courseRating:
          latestFeedback?.rating ?? null,

        primaryFeedback:
          latestFeedback?.primary_feedback ?? null,

        secondaryFeedback:
          latestFeedback?.secondary_feedback ?? null,

        latestFeedbackAt:
          latestFeedback?.created_at ?? null,

      };

    });


  const summary: AdminSummary = {

    totalUsers:
      adminUsers.length,

    completedProfiles:

      adminUsers.filter(
        u => u.isComplete
      ).length,

    averageProgress:

      Math.round(

        adminUsers.reduce(
          (acc, u) =>
            acc + u.progress,
          0
        ) / adminUsers.length

      ),

    approvedUsers:

      adminUsers.filter(
        u => u.quizPassed
      ).length,

    certificatesIssued:
      certificates.length,

    uniqueCertifiedUsers:

      new Set(
        certificates.map(
          c => c.user_id
        )
      ).size,

    adminUsers:

      adminUsers.filter(
        u => u.app_role === "admin"
      ).length,

    usersWithStoreSelection:

      adminUsers.filter(
        u => u.hasStoreSelection
      ).length,

    averageCourseRating:
      4.9,

  };


  const funnel: AdminFunnel = {

    registered:
      adminUsers.length,

    selectedStore:

      adminUsers.filter(
        u => u.hasStoreSelection
      ).length,

    completedProfile:

      adminUsers.filter(
        u => u.isComplete
      ).length,

    completedCourse:

      adminUsers.filter(
        u => u.progress === 100
      ).length,

    passedQuiz:

      adminUsers.filter(
        u => u.quizPassed
      ).length,

    receivedCertificate:

      adminUsers.filter(
        u => u.hasCertificate
      ).length,

  };


  const storeMetrics:
    AdminStoreMetric[] =

    stores.map(store => {

      const selectedUsers =

        adminUsers.filter(

          u => u.storeId === store.id

        );


      return {

        storeId:
          store.id,

        storeName:
          store.name ?? "Loja",

        vacancies:
          store.vacancies ?? 0,

        appliedCount:
          store.applied_count ?? 0,

        active:
          Boolean(
            store.is_active
          ),

        primaryApplications: 0,

        secondaryApplications: 0,

        selectedUsers:
          selectedUsers.length,

        completedProfiles:

          selectedUsers.filter(
            u => u.isComplete
          ).length,

        completedCourseUsers:

          selectedUsers.filter(
            u => u.progress === 100
          ).length,

        passedQuizUsers:

          selectedUsers.filter(
            u => u.quizPassed
          ).length,

        certifiedUsers:

          selectedUsers.filter(
            u => u.hasCertificate
          ).length,

      };

    });


  return {

    users:
      adminUsers,

    certificates:
      certificates as AdminCertificate[],

    summary,

    funnel,

    stores:
      storeMetrics,

  };

}

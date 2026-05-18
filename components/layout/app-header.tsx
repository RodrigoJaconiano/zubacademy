import Link from "next/link";
import Image from "next/image";

import AppNav, {
  type HeaderCourseProgress,
} from "@/components/layout/app-nav";

import { createClient } from "@/lib/supabase/server";
import { isZubaleAdmin } from "@/lib/utils/auth";

type AppHeaderProps = {
  userName?: string | null;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  brand_id?: string | null;
  brands?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

type LessonRow = {
  id: string;
  course_id: string;
};

type LessonProgressRow = {
  id: string;
  course_id: string | null;
  lesson_id: string | null;
  completed: boolean | null;
};

type QuizAttemptRow = {
  id: string;
  course_id: string | null;
  passed?: boolean | null;
  completed_at?: string | null;
};

type CertificateRow = {
  id: string;
  course_id: string | null;
};

function calculateProgress(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export default async function AppHeader({ userName }: AppHeaderProps) {
  const normalizedUserName = userName?.trim();
  const hasUserName =
    Boolean(normalizedUserName) && normalizedUserName !== "Aluno(a)";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let appRole: string | null = null;
  let courseProgress: HeaderCourseProgress[] = [];

  if (user?.id) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao carregar app_role no header:", profileError.message);
    }

    appRole = profile?.app_role ?? null;

    const [
      { data: courses, error: coursesError },
      { data: lessons, error: lessonsError },
      { data: progressRows, error: progressError },
      { data: quizAttempts, error: quizError },
      { data: certificates, error: certificatesError },
    ] = await Promise.all([
      supabase
        .from("courses")
        .select(
          `
          id,
          slug,
          title,
          brand_id,
          brands (
            id,
            name,
            slug
          )
        `
        )
        .eq("active", true)
        .returns<CourseRow[]>(),

      supabase
        .from("lessons")
        .select("id, course_id")
        .eq("is_active", true)
        .returns<LessonRow[]>(),

      supabase
        .from("lesson_progress")
        .select("id, course_id, lesson_id, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .returns<LessonProgressRow[]>(),

      supabase
        .from("quiz_attempts")
        .select("id, course_id, passed, completed_at")
        .eq("user_id", user.id)
        .returns<QuizAttemptRow[]>(),

      supabase
        .from("certificates")
        .select("id, course_id")
        .eq("user_id", user.id)
        .returns<CertificateRow[]>(),
    ]);

    if (coursesError) {
      console.error("Erro ao carregar cursos no header:", coursesError.message);
    }

    if (lessonsError) {
      console.error("Erro ao carregar aulas no header:", lessonsError.message);
    }

    if (progressError) {
      console.error("Erro ao carregar progresso no header:", progressError.message);
    }

    if (quizError) {
      console.error("Erro ao carregar quizzes no header:", quizError.message);
    }

    if (certificatesError) {
      console.error(
        "Erro ao carregar certificados no header:",
        certificatesError.message
      );
    }

    const safeCourses = courses ?? [];
    const safeLessons = lessons ?? [];
    const safeProgressRows = progressRows ?? [];
    const safeQuizAttempts = quizAttempts ?? [];
    const safeCertificates = certificates ?? [];

    const totalLessonsByCourseId = new Map<string, number>();
    const completedLessonsByCourseId = new Map<string, number>();
    const hasQuizByCourseId = new Set<string>();
    const hasCertificateByCourseId = new Set<string>();

    for (const lesson of safeLessons) {
      totalLessonsByCourseId.set(
        lesson.course_id,
        (totalLessonsByCourseId.get(lesson.course_id) ?? 0) + 1
      );
    }

    for (const progress of safeProgressRows) {
      if (!progress.course_id) continue;

      completedLessonsByCourseId.set(
        progress.course_id,
        (completedLessonsByCourseId.get(progress.course_id) ?? 0) + 1
      );
    }

    for (const attempt of safeQuizAttempts) {
      if (attempt.course_id && (attempt.completed_at || attempt.passed)) {
        hasQuizByCourseId.add(attempt.course_id);
      }
    }

    for (const certificate of safeCertificates) {
      if (certificate.course_id) {
        hasCertificateByCourseId.add(certificate.course_id);
      }
    }

    courseProgress = safeCourses
      .map((course) => {
        const totalLessons = totalLessonsByCourseId.get(course.id) ?? 0;
        const completedLessons = completedLessonsByCourseId.get(course.id) ?? 0;
        const progressPercentage = calculateProgress(
          completedLessons,
          totalLessons
        );

        const hasStarted =
          completedLessons > 0 ||
          hasQuizByCourseId.has(course.id) ||
          hasCertificateByCourseId.has(course.id);

        return {
          id: course.id,
          slug: course.slug,
          title: course.title,
          brandName: course.brands?.name ?? null,
          totalLessons,
          completedLessons,
          progressPercentage,
          quizCompleted: hasQuizByCourseId.has(course.id),
          certificateIssued: hasCertificateByCourseId.has(course.id),
          hasStarted,
        };
      })
      .filter((course) => course.hasStarted)
      .sort((a, b) => {
        if (b.progressPercentage !== a.progressPercentage) {
          return b.progressPercentage - a.progressPercentage;
        }

        return a.title.localeCompare(b.title);
      });
  }

  const admin = isZubaleAdmin({
    email: user?.email,
    appRole,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          aria-label="Ir para o dashboard da Zubacademy"
          className="group relative inline-flex items-center gap-3 rounded-2xl px-1 py-1 transition duration-200 hover:opacity-95 active:scale-95"
        >
          <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-active:opacity-100">
            <span className="absolute inset-0 rounded-2xl bg-blue-100/70 animate-pulse" />
          </span>

          <div className="relative z-10 h-12 w-12 overflow-hidden rounded-2xl bg-blue-600 shadow-sm transition duration-200 group-hover:shadow-md">
            <Image
              src="/images/zubacademyico.png"
              alt="Logo da Zubacademy"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="relative z-10 hidden min-w-0 sm:block">
            <p className="truncate text-base font-bold tracking-tight !text-slate-900">
              Zubacademy
            </p>
            <p className="truncate text-xs !text-slate-500">
              Plataforma de treinamento oficial da Zubale
            </p>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3">
          <AppNav isAdmin={admin} courseProgress={courseProgress} />

          {hasUserName && (
            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right sm:block">
              <p className="text-[11px] uppercase tracking-wide !text-slate-500">
                Bem-vindo(a)
              </p>
              <p className="max-w-[180px] truncate text-sm font-semibold !text-slate-900">
                {normalizedUserName}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

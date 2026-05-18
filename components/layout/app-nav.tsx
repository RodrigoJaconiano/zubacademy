"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAppNavigation } from "@/lib/utils/navigation";

export type HeaderCourseProgress = {
  id: string;
  slug: string;
  title: string;
  brandName: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  quizCompleted: boolean;
  certificateIssued: boolean;
  hasStarted: boolean;
};

type AppNavProps = {
  isAdmin?: boolean;
  courseProgress?: HeaderCourseProgress[];
};

function getCourseStatusLabel(course: HeaderCourseProgress) {
  if (course.certificateIssued) {
    return "Certificado emitido";
  }

  if (course.quizCompleted) {
    return "Quiz concluído";
  }

  if (course.progressPercentage >= 100) {
    return "Aulas concluídas";
  }

  if (course.completedLessons > 0) {
    return `${course.progressPercentage}% concluído`;
  }

  return "Não iniciado";
}

export default function AppNav({
  isAdmin = false,
  courseProgress = [],
}: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const startedCourses = courseProgress.filter((course) => course.hasStarted);

  const mainCourse = startedCourses[0] ?? null;

  const quizHref = "/quiz";

  const appNavigation = getAppNavigation({
    isAdmin,
    quizHref,
  });

  const currentValue =
    appNavigation.find((item) => {
      if (item.label === "Quiz") {
        return pathname.includes("/quiz");
      }

      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    })?.href ?? "/dashboard";

  return (
    <div className="flex items-center gap-2">
      {startedCourses.length > 0 ? (
        <div className="hidden lg:block">
          <label htmlFor="course-switcher" className="sr-only">
            Meus treinamentos
          </label>

          <select
            id="course-switcher"
            defaultValue=""
            onChange={(event) => {
              const value = event.target.value;

              if (!value) return;

              router.push(value);
            }}
            className="max-w-[260px] rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 shadow-sm outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Meus treinamentos</option>

            {startedCourses.map((course) => (
              <option key={course.id} value={`/treinamentos/${course.slug}`}>
                {course.brandName ?? course.title} · {course.progressPercentage}%
              </option>
            ))}

            <option value="/treinamentos">Ver todos os treinamentos</option>
          </select>
        </div>
      ) : (
        <Link
          href="/treinamentos"
          className="hidden rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 transition hover:border-blue-200 hover:bg-blue-100 lg:inline-flex"
        >
          Escolher treinamento
        </Link>
      )}

      <nav className="hidden items-center gap-2 md:flex">
        {appNavigation.map((item) => {
          const isActive =
            item.label === "Quiz"
              ? pathname.includes("/quiz")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition duration-200 ${
                isActive
                  ? "bg-blue-600 !text-white shadow-sm hover:bg-blue-700"
                  : "bg-transparent !text-black hover:bg-slate-100 !font-bold"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="md:hidden">
        <label htmlFor="mobile-navigation" className="sr-only">
          Navegação da plataforma
        </label>

        <select
          id="mobile-navigation"
          value={currentValue}
          onChange={(e) => router.push(e.target.value)}
          className="w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold !text-black shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {appNavigation.map((item) => (
            <option key={`${item.label}-${item.href}`} value={item.href}>
              {item.label}
            </option>
          ))}

          {startedCourses.length > 0 ? (
            <>
              <option disabled>──────────</option>

              {startedCourses.map((course) => (
                <option key={course.id} value={`/treinamentos/${course.slug}`}>
                  {course.brandName ?? course.title} ·{" "}
                  {getCourseStatusLabel(course)}
                </option>
              ))}
            </>
          ) : null}
        </select>
      </div>
    </div>
  );
}

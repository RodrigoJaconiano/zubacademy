import { notFound, redirect } from "next/navigation";

import CourseClient from "@/components/course/CourseClient";

import PageContainer from "@/components/ui/page-container";
import PageState from "@/components/ui/page-state";

import { createClient } from "@/lib/supabase/server";

import {
  getCourseBySlug,
  getLessonsByCourse,
} from "@/lib/services/course-service";

import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

import type { Course } from "@/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

type RawProfileRow = {
  name?: string | null;
  phone?: string | null;
  cpf?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | number | null;
  terms_accepted?: boolean | null;
};

export default async function TreinamentoPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const lessons = await getLessonsByCourse(course.id);

  const [
    { data: progressData, error: progressError },
    { data: rawProfile, error: profileError },
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", course.id),

    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted"
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (progressError || profileError) {
    console.error("Erro ao carregar treinamento:", {
      progressError,
      profileError,
    });

    return (
      <PageContainer>
        <PageState
          eyebrow="Treinamento"
          title="Erro ao carregar treinamento"
          description="Não foi possível carregar seu andamento neste treinamento agora. Tente novamente em instantes."
        />
      </PageContainer>
    );
  }

  const profileRow = rawProfile as RawProfileRow | null;

  const profile: ProfileData | null = profileRow
    ? {
        name: profileRow.name ?? null,
        phone: profileRow.phone ?? null,
        cpf: profileRow.cpf ?? null,
        cep: profileRow.cep ?? null,
        city: profileRow.city ?? null,
        state: profileRow.state ?? null,
        address: profileRow.address ?? null,
        number:
          profileRow.number === null || profileRow.number === undefined
            ? null
            : String(profileRow.number),
      }
    : null;

  const profileIncomplete = getMissingProfileFields(profile).length > 0;
  const termsAccepted = Boolean(profileRow?.terms_accepted);

  if (profileIncomplete || !termsAccepted) {
    redirect("/perfil");
  }

  const formattedCourse: Course = {
    id: course.id,
    title: course.title,
    description: course.description,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoId: lesson.video_id,
      order: lesson.lesson_order,
    })),
  };

  return (
    <PageContainer>
      <CourseClient
        course={formattedCourse}
        initialProgress={progressData ?? []}
      />
    </PageContainer>
  );
}


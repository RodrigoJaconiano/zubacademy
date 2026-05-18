import { createClient } from "@/lib/supabase/server";

export type CourseRow = {
  id: string;
  brand_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_video_url: string | null;
  active: boolean | null;
  created_at?: string | null;
  brands?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

export type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_id: string;
  lesson_order: number;
  is_active: boolean | null;
  created_at?: string | null;
};

export type CertificateVideoRow = {
  id: string;
  course_id: string | null;
  title: string | null;
  description: string | null;
  video_id: string | null;
  is_active: boolean | null;
};

export async function getCourseBySlug(
  slug: string
): Promise<CourseRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      id,
      brand_id,
      slug,
      title,
      description,
      thumbnail_url,
      youtube_video_url,
      active,
      created_at,
      brands (
        id,
        name,
        slug
      )
    `
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle<CourseRow>();

  if (error) {
    console.error("Erro ao buscar curso por slug:", error);
    return null;
  }

  return data ?? null;
}

export async function getLessonsByCourse(
  courseId: string
): Promise<LessonRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
      id,
      course_id,
      title,
      description,
      video_id,
      lesson_order,
      is_active,
      created_at
    `
    )
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("lesson_order", { ascending: true })
    .returns<LessonRow[]>();

  if (error) {
    console.error("Erro ao buscar aulas do curso:", error);
    return [];
  }

  return data ?? [];
}

export async function getCertificateVideoByCourse(
  courseId: string
): Promise<CertificateVideoRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_certificate_videos")
    .select(
      `
      id,
      course_id,
      title,
      description,
      video_id,
      is_active
    `
    )
    .eq("course_id", courseId)
    .eq("is_active", true)
    .maybeSingle<CertificateVideoRow>();

  if (error) {
    console.error("Erro ao buscar vídeo do certificado:", error);
    return null;
  }

  return data ?? null;
}

import { createClient } from "@/lib/supabase/server"

export type CourseWithBrand = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_video_url: string | null;
  active: boolean;
  brand_id: string;

  brands:
    | {
        id: string;
        slug: string;
        name: string;
      }
    | {
        id: string;
        slug: string;
        name: string;
      }[]
    | null;
};

export async function getAllCourses(): Promise<CourseWithBrand[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      thumbnail_url,
      youtube_video_url,
      active,
      brand_id,
      brands (
        id,
        slug,
        name
      )
    `)
    .eq("active", true)
    .order("title")

  if (error) {
    console.error("Erro ao buscar cursos:", error)
    return []
  }


  return (data as CourseWithBrand[]) ?? []
}

export async function getCourseBySlug(
  slug: string
): Promise<CourseWithBrand | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      thumbnail_url,
      youtube_video_url,
      active,
      brand_id,
      brands (
        id,
        slug,
        name
      )
    `)
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Erro ao buscar curso:", error)
    return null
  }

  return data as CourseWithBrand
}

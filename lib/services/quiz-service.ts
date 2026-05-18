import { createClient } from "@/lib/supabase/server";
import type { QuizQuestion } from "@/types";

export async function getQuizQuestionsByCourse(
  courseId: string
): Promise<QuizQuestion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_questions")
    .select(
      `
      id,
      question,
      explanation,
      question_order,
      quiz_options (
        id,
        option_text,
        is_correct
      )
    `
    )
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("question_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar perguntas:", error);
    return [];
  }

  return (data ?? []) as QuizQuestion[];
}

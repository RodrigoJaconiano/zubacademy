"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizClientProps = {
  questions: QuizQuestion[];
};

type QuizResult = {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
};

const PASSING_PERCENTAGE = 70;
const COURSE_SLUG = "treinamento-zubale";

function generateCertificateCode(userId: string, courseSlug: string) {
  const userFragment = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const slugFragment = courseSlug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return `${slugFragment}-${userFragment}`;
}

export default function QuizClient({ questions }: QuizClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answeredCount === questions.length;

  function handleSelectAnswer(questionId: string, option: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }

  function calculateResult(): QuizResult {
    const correctAnswers = questions.reduce((total, question) => {
      const selectedAnswer = answers[question.id];
      return selectedAnswer === question.correctAnswer ? total + 1 : total;
    }, 0);

    const totalQuestions = questions.length;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    return {
      score: correctAnswers,
      total: totalQuestions,
      percentage,
      passed: percentage >= PASSING_PERCENTAGE,
    };
  }

  async function handleSubmitQuiz() {
    setSubmitError(null);

    if (!allAnswered) {
      setSubmitError("Responda todas as perguntas antes de finalizar o quiz.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const quizResult = calculateResult();
      setResult(quizResult);

      const completedAt = new Date().toISOString();

      const { error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          score: quizResult.percentage,
          passed: quizResult.passed,
          completed_at: completedAt,
        });

      if (attemptError) {
        throw new Error("Não foi possível salvar sua tentativa no quiz.");
      }

      if (quizResult.passed) {
        const { data: existingCertificate, error: existingCertificateError } =
          await supabase
            .from("certificates")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_slug", COURSE_SLUG)
            .maybeSingle();

        if (existingCertificateError) {
          throw new Error(
            "A aprovação foi salva, mas não foi possível verificar o certificado."
          );
        }

        if (!existingCertificate) {
          const certificateCode = generateCertificateCode(user.id, COURSE_SLUG);

          const { error: certificateError } = await supabase
            .from("certificates")
            .insert({
              user_id: user.id,
              course_slug: COURSE_SLUG,
              certificate_code: certificateCode,
              issued_at: completedAt,
            });

          if (certificateError) {
            throw new Error(
              "A aprovação foi salva, mas houve erro ao emitir o certificado."
            );
          }
        }

        router.push("/certificado");
        router.refresh();
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao finalizar o quiz.";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setSubmitError(null);
  }

  if (result && !result.passed) {
    return (
      <Card>
        <p className="text-sm font-medium text-amber-600">Resultado do quiz</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Você ainda não foi aprovado
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Você acertou{" "}
          <span className="font-semibold text-slate-900">
            {result.score} de {result.total}
          </span>{" "}
          questões ({result.percentage}%).
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Para aprovação, você precisa atingir pelo menos{" "}
            <span className="font-semibold text-slate-900">
              {PASSING_PERCENTAGE}%
            </span>
            .
          </p>
        </div>

        {submitError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Tentar novamente
          </button>

          <button
            type="button"
            onClick={() => router.push("/curso")}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Voltar para o curso
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-sm font-medium text-blue-700">Quiz final</p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Avaliação de conclusão
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Responda todas as perguntas para concluir o treinamento. Ao ser
        aprovado, seu certificado será emitido automaticamente.
      </p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          Progresso do quiz:{" "}
          <span className="font-semibold text-slate-900">
            {answeredCount}/{questions.length}
          </span>{" "}
          respondidas
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {questions.map((question, index) => {
          const selectedAnswer = answers[question.id];

          return (
            <div
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm font-medium text-slate-500">
                Pergunta {index + 1}
              </p>

              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                {question.question}
              </h2>

              <div className="mt-4 space-y-3">
                {question.options.map((option) => {
                  const isSelected = selectedAnswer === option;

                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={isSelected}
                        onChange={() =>
                          handleSelectAnswer(question.id, option)
                        }
                        className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600"
                      />

                      <span className="text-sm leading-6 text-slate-700">
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {submitError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmitQuiz}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Finalizando..." : "Finalizar quiz"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/curso")}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Voltar para o curso
        </button>
      </div>
    </Card>
  );
}
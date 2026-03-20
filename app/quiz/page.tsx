"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/badge";
import SectionHeading from "@/components/ui/section-heading";
import TextMessage from "@/components/ui/text-message";

import { QuizQuestion } from "@/types";

type QuizAttemptLike = {
  id: string;
  score?: number | null;
  passed?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type QuizClientProps = {
  questions: QuizQuestion[];
  initialAttempt?: QuizAttemptLike | null;
  certificateIssued?: boolean;
  passingScore?: number;
};

type QuizQuestionWithShuffledOptions = QuizQuestion & {
  shuffledOptions: string[];
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function formatAttemptDate(date?: string | null) {
  if (!date) return null;

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return null;
  }
}

export default function QuizClient({
  questions,
  initialAttempt = null,
  certificateIssued = false,
  passingScore = 70,
}: QuizClientProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const randomizedQuestions = useMemo<QuizQuestionWithShuffledOptions[]>(() => {
    return questions.map((question) => ({
      ...question,
      shuffledOptions: shuffleArray(question.options),
    }));
  }, [questions]);

  const totalQuestions = randomizedQuestions.length;
  const answeredCount = Object.keys(answers).length;

  const allAnswered =
    totalQuestions > 0 &&
    randomizedQuestions.every((question) => Boolean(answers[question.id]));

  const score = useMemo(() => {
    return randomizedQuestions.reduce((total, question) => {
      return answers[question.id] === question.correctAnswer ? total + 1 : total;
    }, 0);
  }, [answers, randomizedQuestions]);

  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const passed = percentage >= passingScore;

  const latestAttemptDate = formatAttemptDate(
    initialAttempt?.completed_at ?? initialAttempt?.created_at
  );

  function handleSelect(questionId: string, option: string) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    setSubmitted(true);
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Avaliação final"
        title="Quiz do treinamento"
        description="Responda às perguntas abaixo para concluir a etapa final do treinamento. As alternativas são embaralhadas a cada carregamento."
      />

      {initialAttempt && !submitted && (
        <Card className="rounded-[28px] border-blue-100 bg-blue-50/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Última tentativa registrada
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {initialAttempt.score ?? 0}% de aproveitamento
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {latestAttemptDate
                  ? `Realizada em ${latestAttemptDate}.`
                  : "Tentativa anterior encontrada no sistema."}
              </p>
            </div>

            <Badge variant={initialAttempt.passed ? "success" : "warning"}>
              {initialAttempt.passed ? "Aprovado anteriormente" : "Não aprovado"}
            </Badge>
          </div>

          {initialAttempt.passed && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-700">
                Você já possui uma tentativa aprovada.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {certificateIssued
                  ? "Seu certificado já foi emitido e está disponível para consulta."
                  : "Você já pode seguir para a página de certificado."}
              </p>

              <div className="mt-4">
                <Link
                  href="/certificado"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  {certificateIssued
                    ? "Ver certificado"
                    : "Ir para o certificado"}
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="rounded-[28px] border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Progresso do quiz
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {answeredCount}/{totalQuestions} perguntas respondidas
            </h2>
          </div>

          <Badge variant={answeredCount === totalQuestions ? "success" : "info"}>
            {totalQuestions === 0
              ? "Sem perguntas"
              : `${Math.round((answeredCount / totalQuestions) * 100)}% preenchido`}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-6">
        {randomizedQuestions.map((question, index) => {
          const selectedAnswer = answers[question.id];
          const isCorrect = selectedAnswer === question.correctAnswer;

          return (
            <Card key={question.id} className="rounded-[28px] p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Pergunta {index + 1}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      {question.question}
                    </h2>
                  </div>

                  {submitted ? (
                    isCorrect ? (
                      <Badge variant="success">Correta</Badge>
                    ) : (
                      <Badge variant="warning">Incorreta</Badge>
                    )
                  ) : selectedAnswer ? (
                    <Badge variant="info">Respondida</Badge>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  )}
                </div>

                <div className="grid gap-3">
                  {question.shuffledOptions.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectOption = option === question.correctAnswer;

                    let className =
                      "w-full rounded-2xl border px-4 py-3 text-left text-sm transition ";

                    if (!submitted) {
                      className += isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
                    } else {
                      if (isCorrectOption) {
                        className +=
                          "border-green-500 bg-green-50 text-green-900";
                      } else if (isSelected && !isCorrectOption) {
                        className += "border-red-500 bg-red-50 text-red-900";
                      } else {
                        className +=
                          "border-slate-200 bg-white text-slate-500";
                      }
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(question.id, option)}
                        disabled={submitted}
                        className={className}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {submitted && !isCorrect && (
                  <TextMessage variant="error">
                    Resposta correta: {question.correctAnswer}
                  </TextMessage>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {!submitted ? (
        <Card className="rounded-[28px] border-slate-200 bg-slate-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Finalização do quiz
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Responda todas as perguntas para concluir a avaliação.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`sm:w-auto ${
                !allAnswered ? "bg-slate-400 hover:bg-slate-400" : ""
              }`}
            >
              Finalizar quiz
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="rounded-[28px] border-slate-200 bg-slate-50">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Resultado final
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {score}/{totalQuestions} acertos ({percentage}%)
              </h2>
            </div>

            {passed ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Parabéns! Você foi aprovado.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Você atingiu a nota mínima de {passingScore}% e já pode
                    seguir para o certificado.
                  </p>
                </div>

                <Link
                  href="/certificado"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  {certificateIssued ? "Ver certificado" : "Ir para o certificado"}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Você não atingiu a nota mínima.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    É necessário alcançar pelo menos {passingScore}% para seguir
                    para o certificado.
                  </p>
                </div>

                <Button onClick={handleRetry} className="sm:w-auto">
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

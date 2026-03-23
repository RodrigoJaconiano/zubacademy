"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { YouTubeEvent } from "react-youtube";
import { Course, LessonProgressRow } from "@/types";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import SectionHeading from "@/components/ui/section-heading";
import TextMessage from "@/components/ui/text-message";
import CourseCompletionModal from "@/components/course/CourseCompletionModal";

const YouTube = dynamic(() => import("react-youtube"), {
  ssr: false,
});

type CourseClientProps = {
  course: Course;
  initialProgress: LessonProgressRow[];
};

type LessonWatchState = {
  maxAllowedTime: number;
  percent: number;
  completed: boolean;
  duration: number;
};

type YouTubePlayerLike = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};

const MIN_PERCENT_TO_COMPLETE = 90;
const SEEK_TOLERANCE_SECONDS = 2.5;
const POLLING_INTERVAL_MS = 1000;

export default function CourseClient({
  course,
  initialProgress,
}: CourseClientProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(
    initialProgress
      .filter((item) => item.completed)
      .map((item) => item.lesson_id)
  );

  const [watchStateByLesson, setWatchStateByLesson] = useState<
    Record<string, LessonWatchState>
  >({});

  const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] = useState<
    "default" | "success" | "error"
  >("default");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const previousCompletedCountRef = useRef(completedIds.length);
  const playerRefs = useRef<Record<string, YouTubePlayerLike | null>>({});
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval> | null>>(
    {}
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach((intervalId) => {
        if (intervalId) clearInterval(intervalId);
      });
    };
  }, []);

  const progressPercentage = useMemo(() => {
    if (course.lessons.length === 0) return 0;
    return Math.round((completedIds.length / course.lessons.length) * 100);
  }, [completedIds, course.lessons.length]);

  const isCourseCompleted =
    course.lessons.length > 0 &&
    completedIds.length === course.lessons.length;

  useEffect(() => {
    const previousCompletedCount = previousCompletedCountRef.current;
    const hasJustCompletedCourse =
      completedIds.length === course.lessons.length &&
      previousCompletedCount < course.lessons.length;

    if (hasJustCompletedCourse) {
      setShowCompletionModal(true);
    }

    previousCompletedCountRef.current = completedIds.length;
  }, [completedIds.length, course.lessons.length]);

  function clearLessonInterval(lessonId: string) {
    const intervalId = intervalRefs.current[lessonId];
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current[lessonId] = null;
    }
  }

  function updateLessonWatchState(
    lessonId: string,
    updater: (prev: LessonWatchState) => LessonWatchState
  ) {
    setWatchStateByLesson((prev) => {
      const current: LessonWatchState = prev[lessonId] ?? {
        maxAllowedTime: 0,
        percent: 0,
        completed: false,
        duration: 0,
      };

      return {
        ...prev,
        [lessonId]: updater(current),
      };
    });
  }

  function markLessonVideoCompleted(lessonId: string, duration?: number) {
    updateLessonWatchState(lessonId, (prev) => ({
      ...prev,
      duration: duration ?? prev.duration,
      maxAllowedTime: duration ?? prev.maxAllowedTime,
      percent: 100,
      completed: true,
    }));
  }

  function startProgressTracking(lessonId: string) {
    clearLessonInterval(lessonId);

    intervalRefs.current[lessonId] = setInterval(() => {
      const player = playerRefs.current[lessonId];
      if (!player) return;

      try {
        const currentTime = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;

        if (!duration || Number.isNaN(duration)) return;

        setWatchStateByLesson((prev) => {
          const currentState: LessonWatchState = prev[lessonId] ?? {
            maxAllowedTime: 0,
            percent: 0,
            completed: false,
            duration,
          };

          const maxAllowedTime = currentState.maxAllowedTime;
          const hasSkippedForward =
            currentTime > maxAllowedTime + SEEK_TOLERANCE_SECONDS;

          if (hasSkippedForward) {
            player.seekTo(maxAllowedTime, true);

            setMessageVariant("error");
            setMessage(
              "Não é possível pular o vídeo. Assista à aula para liberar a conclusão."
            );

            return prev;
          }

          const newMaxAllowedTime =
            currentTime > maxAllowedTime ? currentTime : maxAllowedTime;

          const newPercent = Math.min(
            100,
            Math.round((newMaxAllowedTime / duration) * 100)
          );

          const completed =
            currentState.completed || newPercent >= MIN_PERCENT_TO_COMPLETE;

          return {
            ...prev,
            [lessonId]: {
              maxAllowedTime: newMaxAllowedTime,
              percent: newPercent,
              completed,
              duration,
            },
          };
        });
      } catch {
        // evita quebrar a UI caso o player ainda não esteja pronto
      }
    }, POLLING_INTERVAL_MS);
  }

  function handlePlayerReady(lessonId: string, event: YouTubeEvent<unknown>) {
    playerRefs.current[lessonId] = event.target as unknown as YouTubePlayerLike;

    try {
      const duration = (
        event.target as unknown as YouTubePlayerLike
      ).getDuration?.();

      if (duration && !Number.isNaN(duration)) {
        updateLessonWatchState(lessonId, (prev) => ({
          ...prev,
          duration,
        }));
      }
    } catch {
      // noop
    }
  }

  function handleVideoStateChange(
    lessonId: string,
    event: YouTubeEvent<number>
  ) {
    const player = event.target as unknown as YouTubePlayerLike;
    playerRefs.current[lessonId] = player;

    // 1 = playing
    if (event.data === 1) {
      startProgressTracking(lessonId);
      return;
    }

    // 0 = ended
    if (event.data === 0) {
      clearLessonInterval(lessonId);

      try {
        const duration = player.getDuration() || 0;
        const lessonState = watchStateByLesson[lessonId];
        const maxAllowedTime = lessonState?.maxAllowedTime ?? 0;
        const watchedPercent = duration
          ? Math.round((maxAllowedTime / duration) * 100)
          : 0;

        const canCompleteByProgress =
          watchedPercent >= MIN_PERCENT_TO_COMPLETE ||
          duration - maxAllowedTime <= SEEK_TOLERANCE_SECONDS;

        if (canCompleteByProgress) {
          markLessonVideoCompleted(lessonId, duration);
        } else {
          player.seekTo(maxAllowedTime, true);
          setMessageVariant("error");
          setMessage(
            "Você ainda não assistiu tempo suficiente da aula para concluí-la."
          );
        }
      } catch {
        setMessageVariant("error");
        setMessage("Não foi possível validar o progresso do vídeo.");
      }

      return;
    }

    // 2 = paused, 3 = buffering, 5 = cued
    if (event.data === 2 || event.data === 3 || event.data === 5) {
      clearLessonInterval(lessonId);
    }
  }

  async function handleCompleteLesson(lessonId: string) {
    setLoadingLessonId(lessonId);
    setMessage("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageVariant("error");
        setMessage(data.error || "Erro ao salvar progresso.");
        return;
      }

      let didCompleteCourseNow = false;

      setCompletedIds((prev) => {
        if (prev.includes(lessonId)) return prev;

        const updated = [...prev, lessonId];

        if (updated.length === course.lessons.length) {
          didCompleteCourseNow = true;
        }

        return updated;
      });

      setMessageVariant("success");
      setMessage(
        didCompleteCourseNow
          ? "Parabéns! Você concluiu o curso. O quiz final já está liberado."
          : "Progresso salvo com sucesso."
      );
    } catch {
      setMessageVariant("error");
      setMessage("Erro de conexão ao salvar progresso.");
    } finally {
      setLoadingLessonId(null);
    }
  }

  return (
    <>
      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
      />

      <div className="space-y-8">
        <SectionHeading
          eyebrow="Treinamento"
          title={course.title}
          description={course.description}
        />

        <Card className="rounded-[28px] border-blue-100 bg-blue-50/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Progresso do curso
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {progressPercentage}% concluído
              </h2>
            </div>

            <Badge variant={progressPercentage === 100 ? "success" : "info"}>
              {completedIds.length}/{course.lessons.length} aulas concluídas
            </Badge>
          </div>

          <ProgressBar value={progressPercentage} />

          {isCourseCompleted && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Quiz final liberado
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Você já pode continuar para a etapa final do treinamento.
                </p>
              </div>

              <Link
                href="/quiz"
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Ir para o quiz final
              </Link>
            </div>
          )}
        </Card>

        <div className="grid gap-6">
          {course.lessons.map((lesson) => {
            const completed = completedIds.includes(lesson.id);
            const lessonWatchState = watchStateByLesson[lesson.id];
            const watchedPercent = lessonWatchState?.percent ?? 0;
            const watched = lessonWatchState?.completed ?? false;
            const canComplete = completed || watched;
            const isLoading = loadingLessonId === lesson.id;

            return (
              <Card key={lesson.id} className="rounded-[28px] p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Aula {lesson.order}
                      </p>

                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                        {lesson.title}
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {lesson.description}
                      </p>
                    </div>

                    {completed ? (
                      <Badge variant="success">Concluída</Badge>
                    ) : watched ? (
                      <Badge variant="info">Vídeo liberado</Badge>
                    ) : (
                      <Badge variant="warning">Pendente</Badge>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
                    {isMounted ? (
                      <YouTube
                        key={`${lesson.id}-${lesson.videoId}`}
                        videoId={lesson.videoId}
                        opts={{
                          width: "100%",
                          height: "420",
                          playerVars: {
                            rel: 0,
                            modestbranding: 1,
                            playsinline: 1,
                          },
                        }}
                        className="w-full"
                        iframeClassName="aspect-video h-auto w-full"
                        onReady={(event: YouTubeEvent<unknown>) =>
                          handlePlayerReady(lesson.id, event)
                        }
                        onStateChange={(event: YouTubeEvent<number>) =>
                          handleVideoStateChange(lesson.id, event)
                        }
                        onError={(event: YouTubeEvent<number>) => {
                          console.log("YouTube error:", lesson.videoId, event.data);
                          setMessageVariant("error");
                          setMessage(
                            "Não foi possível carregar este vídeo no momento."
                          );
                        }}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                        Carregando vídeo...
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      {!completed && !watched && (
                        <div className="space-y-1">
                          <p className="text-slate-500">
                            Assista a pelo menos {MIN_PERCENT_TO_COMPLETE}% do
                            vídeo para liberar a conclusão.
                          </p>
                          <p className="font-medium text-slate-700">
                            Progresso assistido: {watchedPercent}%
                          </p>
                        </div>
                      )}

                      {!completed && watched && (
                        <p className="font-medium text-blue-700">
                          Vídeo assistido o suficiente. Agora você já pode marcar
                          esta aula.
                        </p>
                      )}

                      {completed && (
                        <p className="font-medium text-green-700">
                          ✓ Aula concluída com sucesso.
                        </p>
                      )}
                    </div>

                    <div className="w-full sm:w-auto">
                      <Button
                        onClick={() => handleCompleteLesson(lesson.id)}
                        disabled={!canComplete || completed || isLoading}
                        className={`sm:w-auto ${
                          completed
                            ? "bg-green-600 hover:bg-green-600"
                            : !canComplete
                            ? "bg-slate-400 hover:bg-slate-400"
                            : ""
                        }`}
                      >
                        {completed
                          ? "Aula concluída"
                          : isLoading
                          ? "Salvando..."
                          : "Marcar como concluída"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {message && (
          <TextMessage variant={messageVariant}>{message}</TextMessage>
        )}
      </div>
    </>
  );
}


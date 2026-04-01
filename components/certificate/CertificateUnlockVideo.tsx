"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import ProgressBar from "@/components/ui/progress-bar";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  getDuration: () => number;
  getCurrentTime: () => number;
  destroy: () => void;
};

type CertificateUnlockVideoProps = {
  title: string;
  description: string;
  videoId: string;
  initiallyCompleted: boolean;
};

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<void>((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
  });

  return youtubeApiPromise;
}

export default function CertificateUnlockVideo({
  title,
  description,
  videoId,
  initiallyCompleted,
}: CertificateUnlockVideoProps) {
  const router = useRouter();
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const [progress, setProgress] = useState(initiallyCompleted ? 100 : 0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const safeVideoId = useMemo(() => videoId?.trim() ?? "", [videoId]);

  useEffect(() => {
    if (!safeVideoId || initiallyCompleted) {
      return;
    }

    let isMounted = true;

    function clearProgressInterval() {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    function startProgressInterval() {
      clearProgressInterval();

      progressIntervalRef.current = window.setInterval(() => {
        const player = playerRef.current;
        if (!player) return;

        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();

        if (!duration || duration <= 0) return;

        const percentage = Math.min(
          100,
          Math.round((currentTime / duration) * 100)
        );

        setProgress(percentage);
      }, 1000);
    }

    async function markAsCompleted() {
      if (!isMounted || isCompleting) return;

      try {
        setIsCompleting(true);
        setErrorMessage(null);

        const response = await fetch("/api/certificate-video/complete", {
          method: "POST",
        });

        const result = (await response.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (!response.ok || !result?.ok) {
          throw new Error(
            result?.error ||
              "Não foi possível registrar a conclusão do vídeo obrigatório."
          );
        }

        setProgress(100);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a liberação do certificado.";

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsCompleting(false);
        }
      }
    }

    async function initializePlayer() {
      try {
        await loadYouTubeApi();

        if (!isMounted || !playerContainerRef.current || !window.YT?.Player) {
          return;
        }

        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: safeVideoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onStateChange: (event) => {
              if (!window.YT?.PlayerState) return;

              if (event.data === window.YT.PlayerState.PLAYING) {
                startProgressInterval();
              }

              if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.BUFFERING ||
                event.data === window.YT.PlayerState.CUED
              ) {
                clearProgressInterval();
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                clearProgressInterval();
                setProgress(100);
                void markAsCompleted();
              }
            },
          },
        });
      } catch (error) {
        console.error("Erro ao carregar player do YouTube:", error);
        setErrorMessage(
          "Não foi possível carregar o vídeo obrigatório neste momento."
        );
      }
    }

    void initializePlayer();

    return () => {
      isMounted = false;
      clearProgressInterval();

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [safeVideoId, initiallyCompleted, router, isCompleting]);

  if (!safeVideoId) {
    return (
      <Card>
        <p className="text-sm font-medium text-blue-700">Certificação</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Vídeo obrigatório não configurado
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Defina o <span className="font-semibold">videoId</span> em{" "}
          <span className="font-semibold">lib/data/course.ts</span> para liberar
          esta etapa.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-sm font-medium text-blue-700">Certificação</p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {initiallyCompleted ? "Baixe já nosso App Zubale!" : title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {initiallyCompleted
          ? "O vídeo foi concluído e o certificado liberado, aproveite para baixar o app!"
          : description}
      </p>

      {!initiallyCompleted ? (
        <>
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
            <div className="aspect-video w-full">
              <div ref={playerContainerRef} className="h-full w-full" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Progresso do vídeo</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {progress}% assistido
                </p>
              </div>

              <p className="text-sm font-semibold text-blue-700">{progress}%</p>
            </div>

            <ProgressBar value={progress} />

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Para liberar o certificado, o vídeo precisa ser assistido até o final.
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          ) : null}

          {isCompleting ? (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Registrando conclusão do vídeo e liberando certificado...
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Baixe já nosso App Zubale.
          </p>

          <p className="mt-1 text-sm text-slate-700">
          Lembre-se de criar sua conta e se cadastrar com os mesmos dados que utilizou aqui!
          </p>

          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://play.google.com/store/apps/details?id=mx.com.topup"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:scale-[1.02]"
              aria-label="Baixar o app na Google Play"
            >
              <Image
                src="/images/google-play-badge.png"
                alt="Disponível no Google Play"
                width={180}
                height={54}
                className="h-auto w-[180px]"
                priority
              />
            </a>

            <a
              href="https://apps.apple.com/br/app/zubale/id1403846238"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:scale-[1.02]"
              aria-label="Baixar o app na App Store"
            >
              <Image
                src="/images/app-store-badge.png"
                alt="Baixar na App Store"
                width={180}
                height={54}
                className="h-auto w-[180px]"
                priority
              />
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}

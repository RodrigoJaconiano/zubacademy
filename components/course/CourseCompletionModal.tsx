"use client";

import Link from "next/link";

type CourseCompletionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CourseCompletionModal({
  isOpen,
  onClose,
}: CourseCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-green-100 bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fechar modal"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-14 w-14 animate-[pop_0.5s_ease-out] items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white shadow-lg">
              ✓
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Curso concluído
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Parabéns!
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Você concluiu todas as aulas com sucesso. Seu quiz final já está
            liberado.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Continue agora para finalizar o treinamento e emitir seu
            certificado.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              href="/quiz"
              className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Ir para o quiz final
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Revisar curso
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pop {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          70% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
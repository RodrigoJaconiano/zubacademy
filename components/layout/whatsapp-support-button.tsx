"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "zubacademy_whatsapp_bubble_closed";
const SHOW_DELAY_MS = 500;

export default function WhatsAppSupportButton() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const phone = "556231420385";
  const message = encodeURIComponent(
    "Olá! Preciso de ajuda com a plataforma Zubale Academy."
  );

  useEffect(() => {
    const alreadyClosed = sessionStorage.getItem(SESSION_KEY);

    if (alreadyClosed === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      setReady(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  function handleClose() {
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center">
      {ready && open && (
        <div className="relative mr-1 max-w-[240px] rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={handleClose}
            aria-label="Fechar mensagem de ajuda"
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>

          <p className="pr-6 leading-relaxed">
            Precisa de ajuda?
            <br />
            <strong>Nos chame no WhatsApp!</strong>
          </p>

          <span
            aria-hidden="true"
            className="absolute right-[-7px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white"
          />
        </div>
      )}

      <a
        href={`https://wa.me/${phone}?text=${message}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com o suporte no WhatsApp"
        title="Falar com o suporte"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition duration-200 hover:scale-105 hover:bg-green-600 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.16 1.6 5.97L0 24l6.3-1.65a11.9 11.9 0 0 0 5.75 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.44-8.44Zm-8.46 18.3h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.85 9.85 0 0 1-1.52-5.26c0-5.45 4.43-9.88 9.9-9.88 2.64 0 5.11 1.02 6.98 2.9a9.8 9.8 0 0 1 2.9 6.98c0 5.46-4.43 9.88-9.87 9.88Z"
            fill="white"
          />
          <path
            d="M17.64 14.38c-.3-.15-1.77-.87-2.05-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.93 1.16-.18.2-.35.22-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.19-.24-.57-.49-.5-.66-.5h-.57c-.2 0-.52.08-.79.38-.28.3-1.06 1.03-1.06 2.5 0 1.47 1.08 2.9 1.24 3.1.15.2 2.1 3.2 5.08 4.48.7.3 1.24.48 1.68.61.71.23 1.34.2 1.85.13.56-.08 1.77-.73 2.01-1.43.25-.7.25-1.3.18-1.43-.08-.11-.28-.2-.58-.34Z"
            fill="white"
          />
        </svg>
      </a>
    </div>
  );
}
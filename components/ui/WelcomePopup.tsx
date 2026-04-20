"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export default function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const seen = localStorage.getItem("zubacademy:welcome-popup")

    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true)
      }, 700)

      return () => clearTimeout(timer)
    }
  }, [])

  // 🔒 bloqueia scroll do fundo
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [open])

  function handleClose() {
    localStorage.setItem("zubacademy:welcome-popup", "true")
    setOpen(false)
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="
        fixed inset-0
        z-[999999]
        flex items-center justify-center
        bg-black/60 backdrop-blur-sm

        px-4
        pt-24 sm:pt-28 md:pt-32
        pb-6
      "
      onClick={handleClose}
    >
      {/* CONTAINER AJUSTADO */}
      <div
        className="
          relative
          flex flex-col items-center justify-center
          max-w-[95vw]
          max-h-full

          -translate-y-6 sm:-translate-y-8 md:-translate-y-10
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* IMAGEM */}
        <img
          src="/images/popup.png"
          alt="Aviso"
          className="
            max-w-full
            max-h-[calc(100vh-180px)]
            object-contain
            rounded-2xl
            shadow-2xl
            animate-in zoom-in-95 duration-300
          "
        />

        {/* BOTÃO */}
        <button
          onClick={handleClose}
          className="
            mt-4
            w-full
            max-w-sm
            bg-blue-600
            text-white
            py-3
            rounded-xl
            font-semibold
            shadow-lg
            hover:bg-blue-700
            transition
          "
        >
          Clique para continuar
        </button>
      </div>
    </div>,
    document.body
  )
}

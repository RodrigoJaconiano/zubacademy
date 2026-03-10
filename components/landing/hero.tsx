import Link from "next/link";
import Image from "next/image";

import FeatureCard from "@/components/landing/feature-card";
import StatsCard from "@/components/landing/stats-card";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#dbeafe_0%,#93c5fd_30%,#3b82f6_70%,#2563eb_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.15),transparent_25%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/50 bg-white/80 p-8 shadow-[0_25px_70px_rgba(31,111,235,0.18)] backdrop-blur md:p-10">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Treinamento oficial Zubale
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Capacitação para{" "}
            <span className="text-blue-600">separadores de pedidos</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Uma experiência completa de aprendizado com acesso seguro  <br></br> por e-mail,
            progresso por aula, avaliação final e liberação de certificado.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
            >
              Entrar para começar
            </Link>

            <Link
              href="/curso"
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/70 px-6 py-3.5 text-sm font-semibold text-blue-700 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
            >
              Ver estrutura do curso
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatsCard value="3 aulas" label="Conteúdo objetivo" />
            <StatsCard value="70%" label="Nota mínima no quiz" />
            <StatsCard value="100%" label="Acompanhamento de progresso" />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Aprendizado guiado"
              description="Conteúdo estruturado para facilitar a entrada na operação."
            />
            <FeatureCard
              title="Quiz final"
              description="Validação simples do aprendizado com resultado imediato."
            />
            <FeatureCard
              title="Certificação"
              description="Liberação do certificado após aprovação no treinamento."
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/25 blur-2xl" />
          <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-blue-300/30 blur-2xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/20 shadow-[0_18px_40px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="border-b border-white/40 bg-white/40 px-5 py-4 backdrop-blur">
              <p className="text-sm font-medium text-slate-700">
                Plataforma de treinamento
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Acesso, aulas, progresso e certificação em um só lugar
              </p>
            </div>

          <div className="relative min-h-[520px] p-6">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full rounded-2xl object-cover"
            >
              <source src="/introzubale.mp4" type="video/mp4" />
            </video>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
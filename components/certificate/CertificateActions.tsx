"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CertificateActionsProps = {
  isUnlocked: boolean;
  courseSlug: string;
};

type FeedbackFormState = {
  rating: number;
  primaryFeedback: string;
  secondaryFeedback: string;
};

const initialFeedbackState: FeedbackFormState = {
  rating: 0,
  primaryFeedback: "",
  secondaryFeedback: "",
};

export default function CertificateActions({
  isUnlocked,
  courseSlug,
}: CertificateActionsProps) {
  const supabase = createClient();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] =
    useState<FeedbackFormState>(initialFeedbackState);

  const feedbackQuestions = useMemo(() => {
    if (feedbackState.rating >= 4) {
      return {
        title: "Queremos ouvir sua opinião",
        subtitle:
          "Seu feedback nos ajuda a entender o que está funcionando bem.",
        primaryLabel: "O que você mais gostou?",
        secondaryLabel: "Como foi sua experiência geral?",
        submitLabel: "Enviar feedback e baixar PDF",
      };
    }

    return {
      title: "Queremos melhorar sua experiência",
      subtitle:
        "Seu feedback nos ajuda a corrigir pontos importantes da jornada.",
      primaryLabel: "Como podemos melhorar?",
      secondaryLabel: "O que não foi satisfatório em sua experiência?",
      submitLabel: "Enviar feedback e baixar PDF",
    };
  }, [feedbackState.rating]);

  function resetFeedback() {
    setFeedbackState(initialFeedbackState);
    setFeedbackError(null);
  }

  function openFeedbackModal() {
    if (!isUnlocked || isGenerating) return;
    setFeedbackError(null);
    setIsFeedbackOpen(true);
  }

  function closeFeedbackModal() {
    if (isGenerating) return;
    setIsFeedbackOpen(false);
    resetFeedback();
  }

  async function generatePdf() {
    const certificateElement = document.getElementById("certificate-preview");

    if (!certificateElement) {
      throw new Error("Não foi possível localizar o certificado na página.");
    }

    let tempWrapper: HTMLDivElement | null = null;

    try {
      tempWrapper = document.createElement("div");
      tempWrapper.style.position = "fixed";
      tempWrapper.style.left = "-99999px";
      tempWrapper.style.top = "0";
      tempWrapper.style.width = "1400px";
      tempWrapper.style.background = "#ffffff";
      tempWrapper.style.padding = "24px";
      tempWrapper.style.zIndex = "-1";

      const clonedCertificate = certificateElement.cloneNode(true) as HTMLElement;
      clonedCertificate.style.width = "100%";
      clonedCertificate.style.maxWidth = "100%";
      clonedCertificate.style.background = "#ffffff";
      clonedCertificate.style.boxShadow = "none";
      clonedCertificate.style.border = "1px solid #e2e8f0";
      clonedCertificate.style.borderRadius = "24px";
      clonedCertificate.style.color = "#0f172a";
      clonedCertificate.style.filter = "none";

      tempWrapper.appendChild(clonedCertificate);
      document.body.appendChild(tempWrapper);

      const canvas = await html2canvas(clonedCertificate, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save("certificado-zubacademy.pdf");
    } finally {
      if (tempWrapper && document.body.contains(tempWrapper)) {
        document.body.removeChild(tempWrapper);
      }
    }
  }

  async function handleSubmitFeedbackAndDownload() {
    setFeedbackError(null);

    if (!isUnlocked) {
      setFeedbackError(
        "Assista ao vídeo obrigatório para liberar o download do certificado."
      );
      return;
    }

    if (feedbackState.rating < 1 || feedbackState.rating > 5) {
      setFeedbackError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    if (!feedbackState.primaryFeedback.trim()) {
      setFeedbackError("Preencha a primeira pergunta de feedback.");
      return;
    }

    if (!feedbackState.secondaryFeedback.trim()) {
      setFeedbackError("Preencha a segunda pergunta de feedback.");
      return;
    }

    try {
      setIsGenerating(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const { error: feedbackInsertError } = await supabase
        .from("certificate_feedback")
        .insert({
          user_id: user.id,
          course_slug: courseSlug,
          rating: feedbackState.rating,
          primary_feedback: feedbackState.primaryFeedback.trim(),
          secondary_feedback: feedbackState.secondaryFeedback.trim(),
        });

      if (feedbackInsertError) {
        throw new Error(
          "Não foi possível salvar seu feedback antes do download."
        );
      }

      await generatePdf();

      setIsFeedbackOpen(false);
      resetFeedback();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o download do certificado.";

      setFeedbackError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <button
          type="button"
          onClick={openFeedbackModal}
          disabled={!isUnlocked || isGenerating}
          className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
            isUnlocked
              ? "bg-blue-600 hover:bg-blue-700"
              : "cursor-not-allowed bg-slate-400"
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {!isUnlocked
            ? "Assista ao vídeo para liberar o PDF"
            : isGenerating
              ? "Gerando PDF..."
              : "Baixar certificado em PDF"}
        </button>
      </div>

      {isFeedbackOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Feedback do certificado
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {feedbackQuestions.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feedbackQuestions.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFeedbackModal}
                disabled={isGenerating}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-900">
                Como você avalia sua experiência?
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = feedbackState.rating >= star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setFeedbackState((prev) => ({
                          ...prev,
                          rating: star,
                        }))
                      }
                      disabled={isGenerating}
                      className={`rounded-2xl border px-4 py-3 text-2xl transition ${
                        active
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                      aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                    >
                      <span className={active ? "text-amber-500" : "text-slate-300"}>
                        ★
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {feedbackState.rating > 0 ? (
              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="primary-feedback"
                    className="block text-sm font-semibold text-slate-900"
                  >
                    {feedbackQuestions.primaryLabel}
                  </label>
                  <textarea
                    id="primary-feedback"
                    value={feedbackState.primaryFeedback}
                    onChange={(event) =>
                      setFeedbackState((prev) => ({
                        ...prev,
                        primaryFeedback: event.target.value,
                      }))
                    }
                    disabled={isGenerating}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder={
                      feedbackState.rating >= 4
                        ? "Conte o que mais te agradou na experiência."
                        : "Conte o que podemos melhorar."
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="secondary-feedback"
                    className="block text-sm font-semibold text-slate-900"
                  >
                    {feedbackQuestions.secondaryLabel}
                  </label>
                  <textarea
                    id="secondary-feedback"
                    value={feedbackState.secondaryFeedback}
                    onChange={(event) =>
                      setFeedbackState((prev) => ({
                        ...prev,
                        secondaryFeedback: event.target.value,
                      }))
                    }
                    disabled={isGenerating}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder={
                      feedbackState.rating >= 4
                        ? "Descreva como foi a sua experiência geral."
                        : "Explique o que não foi satisfatório."
                    }
                  />
                </div>
              </div>
            ) : null}

            {feedbackError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{feedbackError}</p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeFeedbackModal}
                disabled={isGenerating}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmitFeedbackAndDownload}
                disabled={isGenerating}
                className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating
                  ? "Salvando feedback e gerando PDF..."
                  : feedbackQuestions.submitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

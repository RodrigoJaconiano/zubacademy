"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState } from "react";

export default function CertificateActions() {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownloadPdf() {
    const certificateElement = document.getElementById("certificate-preview");

    if (!certificateElement) return;

    let tempWrapper: HTMLDivElement | null = null;

    try {
      setIsGenerating(true);

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
    } catch (error) {
      console.error("Erro ao gerar PDF do certificado:", error);
    } finally {
      if (tempWrapper && document.body.contains(tempWrapper)) {
        document.body.removeChild(tempWrapper);
      }

      setIsGenerating(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isGenerating ? "Gerando PDF..." : "Baixar certificado em PDF"}
      </button>
    </div>
  );
}
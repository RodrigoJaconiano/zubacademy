import Image from "next/image";

type CertificatePreviewProps = {
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  certificateCode: string;
  locked?: boolean;
  lockedMessage?: string;
};

export default function CertificatePreview({
  studentName,
  courseTitle,
  issuedAt,
  certificateCode,
  locked = false,
  lockedMessage = "Assista ao vídeo obrigatório para desbloquear seu certificado.",
}: CertificatePreviewProps) {
  return (
    <div className="relative">
      <div
        id="certificate-preview"
        className={`mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border bg-white shadow-sm transition ${
          locked ? "select-none" : ""
        }`}
        style={{
          borderColor: "#e2e8f0",
          backgroundColor: "#ffffff",
          color: "#0f172a",
        }}
        aria-hidden={locked}
      >
        <div className={locked ? "pointer-events-none blur-[6px]" : ""}>
          <div
            className="border-b px-8 py-6"
            style={{
              borderColor: "#e2e8f0",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: "#1d4ed8" }}
            >
              Certificação
            </p>

            <h1
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: "#0f172a" }}
            >
              Certificado de Conclusão
            </h1>
          </div>

          <div className="px-8 py-10 sm:px-12 sm:py-12">
            <div className="mx-auto max-w-4xl text-center">
              <p
                className="text-sm uppercase tracking-[0.3em]"
                style={{ color: "#64748b" }}
              >
                Certificamos que
              </p>

              <h2
                className="mt-5 break-words text-4xl font-bold tracking-tight sm:text-6xl"
                style={{ color: "#0f172a" }}
              >
                {studentName}
              </h2>

              <p
                className="mt-8 text-lg leading-7"
                style={{ color: "#475569" }}
              >
                concluiu com sucesso o treinamento
              </p>

              <p
                className="mt-2 text-3xl font-semibold sm:text-4xl"
                style={{ color: "#0f172a" }}
              >
                {courseTitle}
              </p>

              <p
                className="mt-8 text-sm sm:text-base"
                style={{ color: "#475569" }}
              >
                Emitido em{" "}
                <span
                  className="font-medium"
                  style={{ color: "#0f172a" }}
                >
                  {issuedAt}
                </span>
              </p>

              <div
                className="mt-12 grid gap-4 rounded-2xl border p-5 text-left sm:grid-cols-2"
                style={{
                  borderColor: "#e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div>
                  <p
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "#64748b" }}
                  >
                    Nome do aluno
                  </p>
                  <p
                    className="mt-1 break-words text-sm font-medium sm:text-base"
                    style={{ color: "#0f172a" }}
                  >
                    {studentName}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "#64748b" }}
                  >
                    Código de validação
                  </p>
                  <p
                    className="mt-1 break-words text-sm font-medium sm:text-base"
                    style={{ color: "#0f172a" }}
                  >
                    {certificateCode}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
                  style={{
                    borderColor: "#e2e8f0",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                    <Image
                      src="/images/zubacademyico.png"
                      alt="Logo da Zubacademy"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  <div className="text-right">
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: "#64748b" }}
                    >
                      Certificação oficial
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#0f172a", textAlign: "center" }}
                    >
                      Zubacademy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 px-6">
            <div className="max-w-xl rounded-3xl border border-white/30 bg-white/90 px-6 py-5 text-center shadow-xl backdrop-blur-sm">
              <p className="text-sm font-semibold text-blue-700">
                Certificado bloqueado
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Falta só uma última etapa
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {lockedMessage}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

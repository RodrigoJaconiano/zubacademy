"use client";

import { useRef, useState } from "react";

type TermsModalProps = {
  open: boolean;
  onAccept: () => void;
  onClose?: () => void;
  loading?: boolean;
};

export default function TermsModal({
  open,
  onAccept,
  onClose,
  loading = false,
}: TermsModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  function checkScrollPosition() {
    const element = scrollRef.current;
    if (!element) return;

    const threshold = 12;
    const contentFitsWithoutScroll =
      element.scrollHeight <= element.clientHeight + 8;

    const reachedEnd =
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - threshold;

    setHasReachedEnd(contentFitsWithoutScroll || reachedEnd);
  }

  function handleOpenAutoCheck(node: HTMLDivElement | null) {
    scrollRef.current = node;

    if (!node || !open) return;

    requestAnimationFrame(() => {
      const contentFitsWithoutScroll =
        node.scrollHeight <= node.clientHeight + 8;

      if (contentFitsWithoutScroll) {
        setHasReachedEnd(true);
      }
    });
  }

  function handleClose() {
    setHasReachedEnd(false);
    onClose?.();
  }

  function handleAcceptClick() {
    onAccept();
    setHasReachedEnd(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      
      {/* Container principal */}
      <div className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            Termos de utilização da plataforma
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Leia atentamente antes de continuar o seu cadastro.
          </p>
        </div>

        {/* Conteúdo scrollável */}
        <div
          ref={handleOpenAutoCheck}
          onScroll={checkScrollPosition}
          className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-700 pb-28 space-y-4"
        >
          <p>
            Ao acessar e utilizar esta plataforma, o usuário declara estar ciente
            e de acordo com as regras de uso, navegação, acompanhamento de
            progresso e emissão de certificado vinculadas ao ambiente de
            treinamento.
            <span className="mt-2 block font-semibold text-red-600">
              <br />
              A liberação do aplicativo da pessoa depende da disponibilidade de
              vagas de freelancers na loja.
            </span>
          </p>

          <p>
            Os conteúdos disponibilizados são destinados exclusivamente ao uso
            pessoal do aluno dentro da plataforma, sendo vedada a reprodução,
            distribuição, compartilhamento, comercialização ou disponibilização
            indevida do material sem autorização prévia.
          </p>

          <p>
            O usuário se compromete a fornecer dados verdadeiros, completos e
            atualizados em seu cadastro, responsabilizando-se pelas informações
            inseridas no sistema, inclusive para fins de certificação.
          </p>

          <p>
            A plataforma poderá armazenar dados necessários para autenticação,
            identificação do usuário, registro de progresso, realização de quiz
            e emissão de certificados, sempre de acordo com a finalidade
            educacional e operacional do ambiente.
          </p>

          <p>
            O acesso é individual e intransferível. O uso indevido da conta,
            tentativa de fraude, compartilhamento de acesso ou qualquer conduta
            que comprometa a integridade da plataforma poderá resultar em
            bloqueio de acesso.
          </p>

          <p>
            Ao prosseguir, você declara que leu, compreendeu e concorda com os
            termos de utilização da plataforma.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-white">
          {!hasReachedEnd ? (
            <p className="mb-3 text-sm text-amber-700">
              Role até o final dos termos para liberar o aceite.
            </p>
          ) : (
            <p className="mb-3 text-sm text-emerald-700">
              Leitura concluída. Você já pode aceitar os termos.
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            {onClose ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Fechar
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleAcceptClick}
              disabled={!hasReachedEnd || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Registrando aceite..." : "Li e aceito os termos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

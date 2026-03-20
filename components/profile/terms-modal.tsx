"use client";

type TermsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function TermsModal({ open, onClose }: TermsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            Termos de utilização da plataforma
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Leia atentamente antes de continuar o seu cadastro.
          </p>
        </div>

        <div className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-700">
          <p>
            Ao acessar e utilizar esta plataforma, o usuário declara estar ciente
            e de acordo com as regras de uso, navegação, acompanhamento de
            progresso e emissão de certificado vinculadas ao ambiente de
            treinamento.{" "}
            <span className="text-red-600 font-semibold">
              A liberação do aplicativo depende da disponibilidade de vagas de freelancers na loja.
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

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Fechar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
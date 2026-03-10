import { LessonProgressRow } from "@/types";

export function getCompletedLessonIds(progress: LessonProgressRow[]) {
  return progress.filter((item) => item.completed).map((item) => item.lesson_id);
}

export function getCourseProgressPercentage(
  totalLessons: number,
  completedLessons: number
) {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

export function calculateProgress(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export type ProfileData = {
  name?: string | null;
  phone?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
};

export function getMissingProfileFields(profile: ProfileData | null) {
  const missingFields: string[] = [];

  if (!profile?.name) missingFields.push("Nome completo");
  if (!profile?.phone) missingFields.push("Telefone");
  if (!profile?.cep) missingFields.push("CEP");
  if (!profile?.city) missingFields.push("Cidade");
  if (!profile?.state) missingFields.push("Estado");
  if (!profile?.address) missingFields.push("Endereço");

  return missingFields;
}

type DashboardStateInput = {
  totalLessons: number;
  completedLessons: number;
  profileIncomplete: boolean;
  quizCompleted: boolean;
  certificateIssued: boolean;
};

type DashboardStep = {
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "info";
};

type DashboardCertificate = {
  description: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "info";
  actionLabel: string;
  actionHref: string;
};

export type DashboardState = {
  progressPercentage: number;
  allLessonsCompleted: boolean;
  quizUnlocked: boolean;
  certificateUnlocked: boolean;
  nextStep: DashboardStep;
  certificate: DashboardCertificate;
  primaryCourseActionLabel: string;
  quickQuizHref: string;
  quickQuizLabel: string;
  quickCertificateHref: string;
  quickCertificateLabel: string;
};

export function getDashboardState({
  totalLessons,
  completedLessons,
  profileIncomplete,
  quizCompleted,
  certificateIssued,
}: DashboardStateInput): DashboardState {
  const progressPercentage = calculateProgress(completedLessons, totalLessons);
  const allLessonsCompleted =
    totalLessons > 0 && completedLessons >= totalLessons;

  const quizUnlocked = allLessonsCompleted && !profileIncomplete;
  const certificateUnlocked =
    allLessonsCompleted && !profileIncomplete && quizCompleted && certificateIssued;

  const primaryCourseActionLabel =
    completedLessons > 0 ? "Continuar curso" : "Começar curso";

  let nextStep: DashboardStep = {
    title: "Concluir o treinamento",
    description:
      "Finalize todas as aulas do curso para desbloquear o quiz final e avançar para a certificação.",
    badgeLabel: "Quiz bloqueado",
    badgeVariant: "warning",
  };

  if (profileIncomplete) {
    nextStep = {
      title: "Completar cadastro",
      description:
        "Preencha seus dados pessoais para liberar todas as funcionalidades da plataforma.",
      badgeLabel: "Cadastro pendente",
      badgeVariant: "warning",
    };
  } else if (allLessonsCompleted && !quizCompleted) {
    nextStep = {
      title: "Realizar quiz final",
      description:
        "Você já concluiu todas as aulas. Agora pode fazer o quiz para liberar o certificado.",
      badgeLabel: "Quiz liberado",
      badgeVariant: "success",
    };
  } else if (allLessonsCompleted && quizCompleted && !certificateIssued) {
    nextStep = {
      title: "Aguardando emissão do certificado",
      description:
        "Seu quiz já foi concluído. Agora falta apenas a emissão do certificado para liberar o acesso.",
      badgeLabel: "Quiz concluído",
      badgeVariant: "info",
    };
  } else if (certificateUnlocked) {
    nextStep = {
      title: "Certificado disponível",
      description:
        "Parabéns! Você concluiu todas as etapas e seu certificado já está disponível.",
      badgeLabel: "Certificado liberado",
      badgeVariant: "success",
    };
  }

  let certificate: DashboardCertificate = {
    description:
      "O certificado será disponibilizado após a aprovação no quiz final e com o cadastro completo.",
    badgeLabel: profileIncomplete
      ? "Complete seu cadastro"
      : "Aguardando aprovação no quiz",
    badgeVariant: profileIncomplete ? "warning" : "info",
    actionLabel: profileIncomplete ? "Atualizar perfil" : "Ver certificado",
    actionHref: profileIncomplete ? "/perfil" : "/certificado",
  };

  if (!profileIncomplete && allLessonsCompleted && quizCompleted && !certificateIssued) {
    certificate = {
      description:
        "Seu quiz já foi concluído com sucesso. Agora o sistema precisa emitir o certificado para liberar o acesso.",
      badgeLabel: "Aguardando emissão",
      badgeVariant: "info",
      actionLabel: "Ver certificado",
      actionHref: "/certificado",
    };
  }

  if (certificateUnlocked) {
    certificate = {
      description:
        "Seu certificado já está disponível para visualização e download.",
      badgeLabel: "Certificado liberado",
      badgeVariant: "success",
      actionLabel: "Ver certificado",
      actionHref: "/certificado",
    };
  }

  const quickQuizHref = profileIncomplete ? "/perfil" : "/quiz";
  const quickQuizLabel = profileIncomplete
    ? "Completar perfil"
    : quizCompleted
    ? "Quiz concluído"
    : quizUnlocked
    ? "Abrir quiz"
    : "Quiz bloqueado";

  const quickCertificateHref = profileIncomplete ? "/perfil" : "/certificado";
  const quickCertificateLabel = profileIncomplete
    ? "Atualizar cadastro"
    : certificateUnlocked
    ? "Abrir certificado"
    : "Ver status do certificado";

  return {
    progressPercentage,
    allLessonsCompleted,
    quizUnlocked,
    certificateUnlocked,
    nextStep,
    certificate,
    primaryCourseActionLabel,
    quickQuizHref,
    quickQuizLabel,
    quickCertificateHref,
    quickCertificateLabel,
  };
}
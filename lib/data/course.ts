import { Course, QuizQuestion } from "@/types";

export const courseData: Course = {
  id: "curso-zubale",
  title: "Treinamento para Separadores de Pedidos",
  description:
    "Capacitação para a operação com foco em qualidade, agilidade e atenção aos detalhes durante a separação e conferência dos pedidos.",
  lessons: [
    {
      id: "aula-1",
      title: "Boas-vindas",
      description: "Introdução ao treinamento e visão geral da operação.",
      videoId: "dQw4w9WgXcQ",
      order: 1,
    },
    {
      id: "aula-2",
      title: "Separação correta dos pedidos",
      description: "Como separar itens com atenção, precisão e organização.",
      videoId: "dQw4w9WgXcQ",
      order: 2,
    },
    {
      id: "aula-3",
      title: "Qualidade e conferência",
      description: "Boas práticas para evitar erros e manter o padrão da operação.",
      videoId: "dQw4w9WgXcQ",
      order: 3,
    },
  ],
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "Qual é um dos principais objetivos da separação de pedidos?",
    options: [
      "Aumentar o tempo da operação",
      "Garantir precisão e qualidade",
      "Ignorar a conferência dos itens",
      "Reduzir a organização",
    ],
    correctAnswer: "Garantir precisão e qualidade",
  },
  {
    id: "q2",
    question: "O que deve ser feito antes de finalizar um pedido?",
    options: [
      "Enviar sem conferir",
      "Ignorar itens faltantes",
      "Realizar checagem dos itens",
      "Trocar produtos semelhantes",
    ],
    correctAnswer: "Realizar checagem dos itens",
  },
];
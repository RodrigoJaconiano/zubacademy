import { Course, QuizQuestion } from "@/types";

/**
 * Função para embaralhar array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Embaralha perguntas e também as opções
 */
export function getShuffledQuiz(): QuizQuestion[] {
  return shuffleArray(quizQuestions).map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
}

export const courseData: Course = {
  id: "curso-zubale",
  title: "Treinamento para Separadores de Pedidos",
  description:
    "Capacitação completa para atuação como separador, incluindo picking, pesagem, substituição, evidências e validação de pedidos.",
  lessons: [
    {
      id: "aula-1",
      title: "Boas-vindas Zubalero!!",
      description: "Introdução e visão geral da operação.",
      videoId: "wuRYEHFO2os",
      order: 1,
    },
    {
      id: "aula-2",
      title: "Separação correta dos pedidos",
      description: "Como separar itens com atenção, precisão e organização.",
      videoId: "05Y2ku4Dnrs",
      order: 2,
    },
    {
      id: "aula-3",
      title: "Qualidade e conferência",
      description:
        "Boas práticas para evitar erros e manter o padrão da operação.",
      videoId: "dQw4w9WgXcQ",
      order: 3,
    },
  ],
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "Ao chegar na loja, qual é o primeiro passo correto?",
    options: [
      "Começar a separar pedidos imediatamente",
      "Se apresentar e buscar orientação na loja",
      "Ir direto para o caixa",
      "Ignorar os funcionários da loja",
    ],
    correctAnswer: "Se apresentar e buscar orientação na loja",
  },
  {
    id: "q2",
    question: "Em alguns fluxos, o que a loja precisa fornecer ao separador?",
    options: [
      "Produtos gratuitos",
      "Login e senha de sistema/app",
      "Dinheiro para compras",
      "Uniforme obrigatório da loja",
    ],
    correctAnswer: "Login e senha de sistema/app",
  },
  {
    id: "q3",
    question: "Qual é a forma padrão de validar um produto no picking?",
    options: [
      "Olhar rapidamente o produto",
      "Escanear o código de barras",
      "Apenas confiar na embalagem",
      "Perguntar a outro cliente",
    ],
    correctAnswer: "Escanear o código de barras",
  },
  {
    id: "q4",
    question: "Se o código de barras não for lido corretamente, o que deve ser feito?",
    options: [
      "Pular o item",
      "Digitar o código manualmente ou validar corretamente",
      "Trocar por qualquer produto parecido",
      "Finalizar o pedido sem ele",
    ],
    correctAnswer: "Digitar o código manualmente ou validar corretamente",
  },
  {
    id: "q5",
    question: "Como deve ser feita a escolha de frutas e hortifruti?",
    options: [
      "Pegar os mais rápidos de pegar",
      "Escolher itens de melhor qualidade",
      "Pegar qualquer produto disponível",
      "Ignorar aparência",
    ],
    correctAnswer: "Escolher itens de melhor qualidade",
  },
  {
    id: "q6",
    question: "Qual é o procedimento correto para itens pesáveis?",
    options: [
      "Ignorar o peso",
      "Pesar, conferir e etiquetar corretamente",
      "Enviar sem etiqueta",
      "Chutar o peso aproximado",
    ],
    correctAnswer: "Pesar, conferir e etiquetar corretamente",
  },
  {
    id: "q7",
    question: "Por que os itens pesáveis devem ser separados por último?",
    options: [
      "Para economizar tempo",
      "Para manter a qualidade e frescor",
      "Porque são mais baratos",
      "Porque não precisam de cuidado",
    ],
    correctAnswer: "Para manter a qualidade e frescor",
  },
  {
    id: "q8",
    question: "O que fazer quando um item não é encontrado?",
    options: [
      "Ignorar e seguir",
      "Confirmar com repositor ou responsável",
      "Cancelar o pedido inteiro",
      "Inventar um produto substituto",
    ],
    correctAnswer: "Confirmar com repositor ou responsável",
  },
  {
    id: "q9",
    question: "Qual é uma regra importante ao organizar o carrinho?",
    options: [
      "Misturar tudo para ganhar tempo",
      "Separar pesados e frágeis corretamente",
      "Colocar tudo em cima",
      "Não se preocupar com organização",
    ],
    correctAnswer: "Separar pesados e frágeis corretamente",
  },
  {
    id: "q10",
    question: "Qual é o erro mais grave durante a separação?",
    options: [
      "Andar devagar",
      "Pegar produto errado",
      "Usar carrinho",
      "Demorar alguns segundos a mais",
    ],
    correctAnswer: "Pegar produto errado",
  },
  {
    id: "q11",
    question: "O que são evidências de separação?",
    options: [
      "Notas fiscais apenas",
      "Fotos e prints que comprovam a separação",
      "Mensagens no WhatsApp",
      "Relatos verbais",
    ],
    correctAnswer: "Fotos e prints que comprovam a separação",
  },
  {
    id: "q12",
    question: "Por que as evidências são importantes?",
    options: [
      "Para ocupar espaço",
      "Para validar a tarefa e garantir pagamento",
      "Para enviar ao cliente",
      "Para controle pessoal",
    ],
    correctAnswer: "Para validar a tarefa e garantir pagamento",
  },
  {
    id: "q13",
    question: "O que pode causar rejeição de uma tarefa?",
    options: [
      "Entrega rápida",
      "Evidências incompletas ou ilegíveis",
      "Organização correta",
      "Separação cuidadosa",
    ],
    correctAnswer: "Evidências incompletas ou ilegíveis",
  },
  {
    id: "q14",
    question: "Após finalizar o pedido, o que deve ser feito?",
    options: [
      "Ir embora imediatamente",
      "Enviar evidências e validar no app",
      "Apagar o pedido",
      "Ignorar o sistema",
    ],
    correctAnswer: "Enviar evidências e validar no app",
  },
  {
    id: "q15",
    question: "Qual é o papel principal do separador na operação?",
    options: [
      "Apenas andar pela loja",
      "Ser o responsável por comprar corretamente para o cliente",
      "Organizar prateleiras",
      "Fazer caixa",
    ],
    correctAnswer:
      "Ser o responsável por comprar corretamente para o cliente",
  },
];
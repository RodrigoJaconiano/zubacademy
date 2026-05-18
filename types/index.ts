export type Lesson = {
  id: string;
  title: string;
  description: string | null;
  videoId: string;
  order: number;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  lessons: Lesson[];
};

export type QuizOption = {
  id: string;
  option_text: string;
  is_correct: boolean;
};

export type QuizQuestion = {
  id: string;
  question: string;
  explanation: string | null;
  question_order: number;
  quiz_options: QuizOption[];
};

export type QuizAttempt = {
  score: number;
  passed: boolean;
};

export type LessonProgressRow = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  created_at: string;
};

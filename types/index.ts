export type Lesson = {
  id: string;
  title: string;
  description: string;
  videoId: string;
  order: number;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
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
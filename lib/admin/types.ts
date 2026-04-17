export type ProfileRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | number | null;
  terms_accepted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  app_role?: string | null;
  store_id?: string | null;
  store_selected_at?: string | null;
  primary_store_name?: string | null;
  secondary_store_names?: string | null;
};

export type CertificateRow = {
  id: string;
  user_id?: string | null;
  certificate_code?: string | null;
  issued_at?: string | null;
  course_slug?: string | null;
};

export type LessonProgressRow = {
  user_id: string;
  lesson_id: string;
  completed?: boolean | null;
};

export type QuizAttemptRow = {
  user_id: string;
  score?: number | null;
  passed?: boolean | null;
  completed_at?: string | null;
};

export type StoreRow = {
  id: string;
  name?: string | null;
  vacancies?: number | null;
  applied_count?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type StoreApplicationRow = {
  id: string;
  user_id?: string | null;
  store_id?: string | null;
  is_primary?: boolean | null;
  created_at?: string | null;
};

export type CertificateFeedbackRow = {
  id: string;
  user_id?: string | null;
  course_slug?: string | null;
  rating?: number | null;
  primary_feedback?: string | null;
  secondary_feedback?: string | null;
  created_at?: string | null;
};

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  app_role: string | null;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  isComplete: boolean;
  missingItems: string[];
  hasCertificate: boolean;
  certificateCount: number;
  quizAttempts: number;
  bestQuizScore: number | null;
  quizPassed: boolean;
  lastQuizAt: string | null;
  storeId: string | null;
  storeSelectedAt: string | null;
  primaryStoreName: string | null;
  secondaryStoreNames: string[];
  selectedStoresCount: number;
  hasStoreSelection: boolean;
  courseRating: number | null;
  primaryFeedback: string | null;
  secondaryFeedback: string | null;
  latestFeedbackAt: string | null;
};

export type AdminCertificate = CertificateRow;

export type AdminSummary = {
  totalUsers: number;
  completedProfiles: number;
  averageProgress: number;
  approvedUsers: number;
  certificatesIssued: number;
  uniqueCertifiedUsers: number;
  adminUsers: number;
  usersWithStoreSelection: number;
  averageCourseRating: number;
};

export type AdminFunnel = {
  registered: number;
  selectedStore: number;
  completedProfile: number;
  completedCourse: number;
  passedQuiz: number;
  receivedCertificate: number;
};

export type AdminStoreMetric = {
  storeId: string;
  storeName: string;
  vacancies: number;
  appliedCount: number;
  active: boolean;
  primaryApplications: number;
  secondaryApplications: number;
  selectedUsers: number;
  completedProfiles: number;
  completedCourseUsers: number;
  passedQuizUsers: number;
  certifiedUsers: number;
};

export type AdminDashboardData = {
  users: AdminUser[];
  certificates: AdminCertificate[];
  summary: AdminSummary;
  funnel: AdminFunnel;
  stores: AdminStoreMetric[];
};


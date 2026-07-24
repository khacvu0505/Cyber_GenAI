export type Subject = "math" | "physics" | "chemistry";
export type Difficulty = "foundation" | "intermediate" | "advanced";
export type ReasoningMode = "direct" | "guided" | "self_consistency";

export interface HealthRead {
  status: string;
  app_name: string;
  environment: string;
  ai_provider: "huggingface";
  execution_mode: string;
  model_id: string;
  model_ready: boolean;
}

export interface ProblemRead {
  id: string;
  subject: Subject;
  topic: string;
  grade: number;
  difficulty: Difficulty;
  title: string;
  prompt: string;
  skills: string[];
  estimated_minutes: number;
}

export interface ReasoningPayload {
  problem_id?: string;
  problem?: string;
  subject: Subject;
  grade: number;
  difficulty: Difficulty;
  mode: ReasoningMode;
  student_answer?: string;
  samples?: number;
}

export interface SolutionStep {
  title: string;
  explanation: string;
  checkpoint: string;
}

export interface VerificationRead {
  status: "verified" | "rejected" | "consensus_only" | "unavailable";
  passed: boolean | null;
  method: string;
  message: string;
}

export interface CandidateSummary {
  answer: string;
  confidence: number;
  verified: boolean | null;
}

export interface ReasoningResponse {
  attempt_id: string | null;
  problem_id: string | null;
  subject: Subject;
  mode: ReasoningMode;
  model_id: string;
  execution_mode: string;
  concepts: string[];
  solution_steps: SolutionStep[];
  hints: string[];
  final_answer: string;
  confidence: number;
  candidates: CandidateSummary[];
  verification: VerificationRead;
  student_feedback: string;
  misconception: string | null;
  follow_up_questions: string[];
}

export type UserRole = "student" | "teacher" | "admin";

export interface UserRead {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  grade: number | null;
  created_at: string;
}

export interface AuthRead {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: UserRead;
}

export interface DashboardRead {
  total_attempts: number;
  verified_attempts: number;
  mastery_score: number;
  current_streak: number;
  longest_streak: number;
  mastery: Array<{
    subject: Subject;
    skill: string;
    attempts_count: number;
    correct_count: number;
    score: number;
  }>;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  role: "student" | "teacher";
  grade?: number;
}

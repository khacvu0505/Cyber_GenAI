export type RequirementStatus = "met" | "partial" | "missing";
export type Recommendation = "strong_match" | "match" | "potential" | "weak_match" | "not_match";

export type RequirementCheck = {
  requirement: string;
  status: RequirementStatus;
  evidence: string;
};

export type RubricCriterion = {
  name: string;
  description: string;
  weight: number;
  scoring_guide: string;
  evidence_required: boolean;
};

export type CriterionScore = {
  name: string;
  max_points: number;
  awarded_points: number;
  score_ratio: number;
  reason: string;
  evidence: string[];
};

export type JobProfile = {
  title: string;
  must_have_requirements: string[];
  nice_to_have_requirements: string[];
  responsibilities: string[];
  required_skills: string[];
  domain_terms: string[];
  years_required: number | null;
};

export type CandidateScore = {
  file_name: string;
  candidate_name: string;
  overall_score: number;
  recommendation: Recommendation;
  qualified: boolean;
  confidence_score: number;
  summary: string;
  must_have_checks: RequirementCheck[];
  criterion_scores: CriterionScore[];
  matched_requirements: string[];
  missing_requirements: string[];
  risks: string[];
  interview_questions: string[];
};

export type RankingResponse = {
  generated_at: string;
  engine: string;
  model: string | null;
  job_profile: JobProfile;
  rubric: RubricCriterion[];
  candidates: CandidateScore[];
};

export type UserResponse = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserResponse;
};

export type AnalysisListItem = {
  id: string;
  title: string;
  engine: string;
  model: string | null;
  candidate_count: number;
  qualified_count: number;
  average_score: number;
  created_at: string;
};

export type AnalysisDetail = AnalysisListItem & {
  result: RankingResponse;
};

export type JDProfileListItem = {
  id: string;
  title: string;
  file_name: string;
  must_have_count: number;
  required_skills: string[];
  created_at: string;
};

export type CVProfileListItem = {
  id: string;
  candidate_name: string;
  file_name: string;
  created_at: string;
};

export type DashboardResponse = {
  total_analyses: number;
  total_candidates: number;
  total_jds: number;
  total_cvs: number;
  qualified_rate: number;
  average_score: number;
  recommendation_counts: Record<string, number>;
  engine_counts: Record<string, number>;
  score_buckets: Record<string, number>;
  recent_analyses: AnalysisListItem[];
};

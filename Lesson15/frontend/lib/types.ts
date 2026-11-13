export type ProposalStatus = "queued" | "running" | "completed" | "failed";

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface ProposalInput {
  title: string;
  client_name: string;
  company_name: string;
  client_brief: string;
  service_description: string;
  budget: string;
  timeline: string;
  constraints: string;
  language: "Tiếng Việt" | "English";
  auto_run?: boolean;
}

export interface ProposalSummary {
  id: string;
  title: string;
  client_name: string;
  company_name: string;
  status: ProposalStatus;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal extends ProposalSummary, Omit<ProposalInput, "auto_run"> {
  requirements_analysis: Record<string, unknown> | null;
  solution_plan: Record<string, unknown> | null;
  risk_review: Record<string, unknown> | null;
  final_markdown: string | null;
  error_message: string | null;
}

export type Department = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  color: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "employee";
  department?: Department | null;
};

export type AdminUser = User & {
  is_active: boolean;
  created_at: string;
};

export type AdminUserList = {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
};

export type DocumentRecord = {
  id: string;
  title: string;
  document_number?: string | null;
  document_type: string;
  security_level: string;
  visibility: string;
  status: "uploaded" | "processing" | "ready" | "failed" | "no_text" | "archived";
  status_message?: string | null;
  original_filename: string;
  content_type: string;
  file_size: number;
  version: number;
  issued_at?: string | null;
  received_at?: string | null;
  due_at?: string | null;
  page_count?: number | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
  department: Department;
  owner: User;
};

export type DocumentList = {
  items: DocumentRecord[];
  total: number;
  page: number;
  page_size: number;
};

export type DepartmentStat = {
  department_id: string;
  code: string;
  name: string;
  color: string;
  document_count: number;
  ready_count: number;
};

export type DashboardSummary = {
  total_documents: number;
  ready_documents: number;
  processing_documents: number;
  total_chunks: number;
  department_stats: DepartmentStat[];
  recent_documents: DocumentRecord[];
};

export type Citation = {
  document_id: string;
  title: string;
  document_number?: string | null;
  page_number?: number | null;
  chunk_index: number;
  excerpt: string;
  distance: number;
};

export type ChatAnswer = {
  session_id: string;
  answer: string;
  citations: Citation[];
};

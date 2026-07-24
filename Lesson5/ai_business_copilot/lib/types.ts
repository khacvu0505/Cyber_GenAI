export type View = "overview" | "customers" | "tasks" | "reports" | "activity" | "copilot";
export type CustomerStatus = "active" | "at_risk" | "lead";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface DashboardMetrics {
  revenue: number;
  active_customers: number;
  at_risk_customers: number;
  open_tasks: number;
  overdue_tasks: number;
  pipeline_value: number;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  value: number;
  last_contact: string;
  owner: string;
}

export interface BusinessTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  due_date: string;
  assignee: string;
  customer_id?: string;
}

export interface CopilotResponse {
  answer: string;
  traces: { tool: string; arguments: Record<string, unknown>; result: string }[];
  approval?: { action: string; payload: Record<string, unknown>; reason: string };
  visualizations: Visualization[];
}

export interface Visualization {
  type: "kpi" | "donut" | "bar";
  title: string;
  description?: string;
  unit?: string;
  data: { label: string; value: number; unit?: string }[];
}

export interface ApprovalExecuteResponse {
  status: string;
  message: string;
  task: BusinessTask;
}

export interface NotificationItem { id: string; title: string; message: string; level: string; is_read: number; created_at: string; }
export interface AuditLog { id: string; actor: string; action: string; entity_type: string; entity_id?: string; details: Record<string, unknown>; created_at: string; }
export interface OperationsReport {
  customer_distribution: Record<string, number>;
  task_distribution: Record<string, number>;
  owner_performance: { owner: string; portfolio_value: number; customers: number }[];
}

export interface SessionUser { id: string; email: string; full_name: string; role: "admin" | "manager" | "sales" | "viewer"; }

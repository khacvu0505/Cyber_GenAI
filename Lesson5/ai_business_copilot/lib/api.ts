import { ApprovalExecuteResponse, AuditLog, BusinessTask, CopilotResponse, Customer, DashboardMetrics, NotificationItem, OperationsReport, SessionUser, TaskStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new Error("Không kết nối được tới API Orbit.");
  }
  if (!response.ok) {
    let detail = `API Orbit trả về lỗi ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  login: (email: string, password: string) => request<SessionUser>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<SessionUser>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  dashboard: () => request<DashboardMetrics>("/dashboard"),
  customers: () => request<Customer[]>("/customers"),
  tasks: () => request<BusinessTask[]>("/tasks"),
  updateTask: (id: string, status: TaskStatus) => request<BusinessTask>(`/tasks/${id}/status?status=${status}`, { method: "PATCH" }),
  copilot: (message: string) => request<CopilotResponse>("/copilot", { method: "POST", body: JSON.stringify({ message }) }),
  executeApproval: (action: string, payload: Record<string, unknown>) => request<ApprovalExecuteResponse>("/approvals/execute", {
    method: "POST",
    body: JSON.stringify({ action, payload }),
  }),
  notifications: () => request<NotificationItem[]>("/notifications"),
  auditLogs: () => request<AuditLog[]>("/audit-logs"),
  operationsReport: () => request<OperationsReport>("/reports/operations"),
};

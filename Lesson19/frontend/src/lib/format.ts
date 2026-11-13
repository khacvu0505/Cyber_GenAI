export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const roleLabel: Record<string, string> = {
  admin: "Quản trị hệ thống",
  manager: "Quản lý phòng ban",
  employee: "Nhân viên",
};

export const documentTypeLabel: Record<string, string> = {
  incoming: "Công văn đến",
  outgoing: "Công văn đi",
  policy: "Quy định / chính sách",
  contract: "Hợp đồng",
  report: "Báo cáo",
  other: "Tài liệu khác",
};

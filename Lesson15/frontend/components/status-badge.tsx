import { CheckCircle2, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { ProposalStatus } from "@/lib/types";

const labels: Record<ProposalStatus, string> = {
  queued: "Đang chờ",
  running: "Đang xử lý",
  completed: "Hoàn tất",
  failed: "Có lỗi",
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  const Icon = status === "completed" ? CheckCircle2 : status === "failed" ? CircleAlert : status === "running" ? LoaderCircle : Clock3;
  return <span className={`status-badge ${status}`}><Icon size={13} className={status === "running" ? "spin" : ""}/>{labels[status]}</span>;
}

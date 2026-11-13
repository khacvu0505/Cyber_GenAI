import { clsx } from "clsx";

const statusText: Record<string, string> = {
  uploaded: "Đã tải lên",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Xử lý lỗi",
  no_text: "Không có text",
  archived: "Lưu trữ",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx("status-badge", {
        "status-ready": status === "ready",
        "status-processing": status === "processing" || status === "uploaded",
        "status-error": status === "failed" || status === "no_text",
        "status-neutral": status === "archived",
      })}
    >
      <span className="status-dot" />
      {statusText[status] ?? status}
    </span>
  );
}

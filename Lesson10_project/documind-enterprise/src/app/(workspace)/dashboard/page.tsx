"use client";

import {
  ArrowRight,
  BotMessageSquare,
  CheckCircle2,
  Clock3,
  Files,
  Layers3,
  Plus,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { documentTypeLabel, formatDateTime } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardSummary>("/dashboard/summary")
      .then(setSummary)
      .catch(() => setError("Chưa thể tải dữ liệu tổng quan."));
  }, []);

  const firstName = user?.full_name.split(" ").at(-1) ?? "bạn";
  const maxDepartmentDocs = Math.max(
    1,
    ...(summary?.department_stats.map((item) => item.document_count) ?? [1]),
  );

  return (
    <div className="dashboard-page">
      <section className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow"><Sparkles size={15} /> Thứ Ba, không gian tri thức sẵn sàng</span>
          <h1>Chào {firstName}, hôm nay bạn cần tìm gì?</h1>
          <p>Theo dõi công văn và khai thác nội dung trong phạm vi được phân quyền.</p>
        </div>
        <div className="heading-actions">
          <Link href="/assistant" className="secondary-button"><BotMessageSquare size={18} /> Hỏi DocuMind</Link>
          <Link href="/upload" className="primary-button"><Plus size={18} /> Tải tài liệu</Link>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid">
        <MetricCard icon={Files} label="Tài liệu có thể truy cập" value={summary?.total_documents} note="Trong phạm vi quyền của bạn" tone="green" />
        <MetricCard icon={CheckCircle2} label="Đã lập chỉ mục" value={summary?.ready_documents} note="Sẵn sàng để hỏi đáp" tone="blue" />
        <MetricCard icon={Clock3} label="Đang xử lý" value={summary?.processing_documents} note="Tự động cập nhật trạng thái" tone="orange" />
        <MetricCard icon={Layers3} label="Đoạn tri thức" value={summary?.total_chunks} note="Được lưu trong pgvector" tone="purple" />
      </section>

      <section className="dashboard-columns">
        <div className="panel department-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Phân bổ tài liệu</span><h2>Theo phòng ban</h2></div>
            <span className="period-pill">Hiện tại</span>
          </div>
          <div className="department-bars">
            {summary?.department_stats.length ? summary.department_stats.map((department) => (
              <div className="department-row" key={department.department_id}>
                <div className="department-label">
                  <span className="department-color" style={{ backgroundColor: department.color }} />
                  <div><strong>{department.name}</strong><span>{department.ready_count} đã sẵn sàng</span></div>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${Math.max(8, (department.document_count / maxDepartmentDocs) * 100)}%`, backgroundColor: department.color }} />
                </div>
                <strong className="bar-value">{department.document_count}</strong>
              </div>
            )) : (
              <div className="empty-compact">Chưa có tài liệu. Hãy tải tài liệu đầu tiên để bắt đầu.</div>
            )}
          </div>
          <div className="panel-note"><ShieldCheckMini /> Số liệu chỉ bao gồm tài liệu bạn được phép truy cập.</div>
        </div>

        <Link href="/assistant" className="assistant-callout">
          <div className="assistant-orbit"><BotMessageSquare size={28} /></div>
          <span className="eyebrow light">Trợ lý tri thức</span>
          <h2>Đừng tìm từng file.<br />Hãy đặt câu hỏi.</h2>
          <p>DocuMind truy xuất các đoạn liên quan và luôn đính kèm nguồn tham chiếu.</p>
          <span className="callout-link">Bắt đầu hỏi <ArrowRight size={17} /></span>
        </Link>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><span className="panel-kicker">Cập nhật gần đây</span><h2>Tài liệu mới nhất</h2></div>
          <Link href="/documents" className="text-link">Xem tất cả <ArrowRight size={16} /></Link>
        </div>
        {summary?.recent_documents.length ? (
          <div className="recent-list">
            {summary.recent_documents.map((document) => (
              <div className="recent-document" key={document.id}>
                <div className="document-icon"><Files size={19} /></div>
                <div className="recent-main"><strong>{document.title}</strong><span>{document.document_number || document.original_filename}</span></div>
                <span className="recent-type">{documentTypeLabel[document.document_type] ?? document.document_type}</span>
                <span className="recent-department"><i style={{ background: document.department.color }} />{document.department.name}</span>
                <StatusBadge status={document.status} />
                <time>{formatDateTime(document.created_at)}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small"><UploadCloud size={26} /><span>Chưa có tài liệu gần đây.</span></div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone }: { icon: typeof Files; label: string; value?: number; note: string; tone: string }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={21} /></div>
      <span>{label}</span>
      <strong>{value === undefined ? "—" : new Intl.NumberFormat("vi-VN").format(value)}</strong>
      <small>{note}</small>
    </div>
  );
}

function ShieldCheckMini() {
  return <span className="shield-mini">✓</span>;
}

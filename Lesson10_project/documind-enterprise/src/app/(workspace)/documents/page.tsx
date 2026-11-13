"use client";

import {
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { documentTypeLabel, formatBytes, formatDate } from "@/lib/format";
import type { DocumentList, DocumentRecord } from "@/lib/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentList | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    try {
      setDocuments(await apiFetch<DocumentList>(`/documents?${params.toString()}`));
    } catch {
      setError("Không thể tải danh sách tài liệu.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(loadDocuments, 250);
    return () => window.clearTimeout(timer);
  }, [loadDocuments]);

  const downloadDocument = async (document: DocumentRecord) => {
    const result = await apiFetch<{ url: string }>(`/documents/${document.id}/download`);
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  const deleteDocument = async (document: DocumentRecord) => {
    if (!window.confirm(`Xóa tài liệu “${document.title}”? Thao tác này không thể hoàn tác.`)) return;
    await apiFetch(`/documents/${document.id}`, { method: "DELETE" });
    await loadDocuments();
  };

  return (
    <div>
      <section className="page-heading">
        <div><span className="eyebrow">Kho công văn</span><h1>Tài liệu doanh nghiệp</h1><p>Quản lý file gốc, trạng thái lập chỉ mục và quyền truy cập.</p></div>
        <Link href="/upload" className="primary-button"><Plus size={18} /> Tải tài liệu</Link>
      </section>

      <section className="document-toolbar">
        <div className="search-input"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tiêu đề hoặc số công văn…" /></div>
        <div className="filter-control"><Filter size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option><option value="ready">Sẵn sàng</option><option value="processing">Đang xử lý</option><option value="failed">Xử lý lỗi</option><option value="no_text">Không có text</option></select></div>
        <button className="icon-button" onClick={loadDocuments} aria-label="Tải lại"><RefreshCw size={18} className={loading ? "spin" : ""} /></button>
        <span className="document-total">{documents?.total ?? 0} tài liệu</span>
      </section>

      {error && <div className="notice error">{error}</div>}

      <section className="panel table-panel">
        <div className="document-table-head">
          <span>Tài liệu</span><span>Phòng ban</span><span>Loại</span><span>Trạng thái</span><span>Cập nhật</span><span />
        </div>
        {loading && !documents ? (
          <div className="table-loading">Đang tải kho tài liệu…</div>
        ) : documents?.items.length ? documents.items.map((document) => (
          <div className="document-table-row" key={document.id}>
            <div className="document-cell-main">
              <div className="document-icon"><FileText size={20} /></div>
              <div><strong>{document.title}</strong><span>{document.document_number || document.original_filename} · {formatBytes(document.file_size)}</span></div>
            </div>
            <span className="department-tag"><i style={{ background: document.department.color }} />{document.department.name}</span>
            <span>{documentTypeLabel[document.document_type] ?? document.document_type}</span>
            <StatusBadge status={document.status} />
            <span>{formatDate(document.updated_at)}</span>
            <div className="row-actions">
              <button onClick={() => downloadDocument(document)} title="Tải file"><Download size={17} /></button>
              <button onClick={() => deleteDocument(document)} title="Xóa tài liệu" className="danger"><Trash2 size={17} /></button>
              <button title="Thêm tùy chọn"><MoreHorizontal size={18} /></button>
            </div>
          </div>
        )) : (
          <div className="empty-state"><div className="empty-icon"><FileText size={29} /></div><h3>Chưa có tài liệu phù hợp</h3><p>Thay đổi bộ lọc hoặc tải tài liệu đầu tiên lên hệ thống.</p><Link href="/upload" className="primary-button"><Plus size={17} /> Tải tài liệu</Link></div>
        )}
      </section>
    </div>
  );
}

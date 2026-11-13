"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  LockKeyhole,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragEvent, FormEvent, useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatBytes } from "@/lib/format";
import type { Department, DocumentRecord } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Department[]>("/departments").then(setDepartments).catch(() => undefined);
  }, []);

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
      setError("Chỉ chấp nhận PDF có text, DOCX hoặc TXT.");
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Hãy chọn một tài liệu.");
      return;
    }
    const form = new FormData(event.currentTarget);
    ["issued_at", "received_at", "due_at"].forEach((field) => {
      if (!form.get(field)) form.delete(field);
    });
    form.set("file", file);
    setSubmitting(true);
    setError("");
    try {
      await apiFetch<DocumentRecord>("/documents", { method: "POST", body: form });
      router.push("/documents");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải tài liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="upload-page">
      <Link href="/documents" className="back-link"><ArrowLeft size={17} /> Quay lại kho tài liệu</Link>
      <section className="page-heading compact">
        <div><span className="eyebrow">Tạo bản ghi mới</span><h1>Tải tài liệu lên</h1><p>File sẽ được lưu trên S3, trích xuất text và lập chỉ mục trong pgvector.</p></div>
      </section>

      <form className="upload-layout" onSubmit={handleSubmit}>
        <div className="upload-main">
          <section className="panel form-section">
            <div className="section-title"><span>01</span><div><h2>Chọn tài liệu</h2><p>Hệ thống hỗ trợ tối đa 25 MB mỗi file.</p></div></div>
            {!file ? (
              <label
                className={dragging ? "dropzone dragging" : "dropzone"}
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf,.docx,.txt" onChange={(event) => chooseFile(event.target.files?.[0])} />
                <div className="drop-icon"><UploadCloud size={28} /></div>
                <h3>Kéo thả tài liệu vào đây</h3>
                <p>hoặc <strong>chọn file từ máy tính</strong></p>
                <span>PDF có text · DOCX · TXT</span>
              </label>
            ) : (
              <div className="selected-file">
                <div className="document-icon large"><FileText size={24} /></div>
                <div><strong>{file.name}</strong><span>{formatBytes(file.size)} · Sẵn sàng tải lên</span></div>
                <CheckCircle2 size={20} className="file-check" />
                <button type="button" onClick={() => setFile(null)} aria-label="Bỏ file"><X size={18} /></button>
              </div>
            )}
            <div className="no-ocr-note"><Info size={17} /><span>Phiên bản hiện tại chưa hỗ trợ OCR. PDF scan hoặc ảnh không có lớp text sẽ được đánh dấu “Không có text”.</span></div>
          </section>

          <section className="panel form-section">
            <div className="section-title"><span>02</span><div><h2>Thông tin công văn</h2><p>Bổ sung metadata để tìm kiếm chính xác hơn.</p></div></div>
            <div className="form-grid">
              <label className="span-2">Tiêu đề tài liệu <em>*</em><input name="title" required placeholder="Ví dụ: Quy chế lương thưởng năm 2026" /></label>
              <label>Số / ký hiệu công văn<input name="document_number" placeholder="VD: 18/QĐ-CT" /></label>
              <label>Loại tài liệu<select name="document_type" defaultValue="policy"><option value="incoming">Công văn đến</option><option value="outgoing">Công văn đi</option><option value="policy">Quy định / chính sách</option><option value="contract">Hợp đồng</option><option value="report">Báo cáo</option><option value="other">Khác</option></select></label>
              <label>Ngày ban hành<input name="issued_at" type="date" /></label>
              <label>Hạn xử lý<input name="due_at" type="date" /></label>
            </div>
          </section>

          <section className="panel form-section">
            <div className="section-title"><span>03</span><div><h2>Phân quyền truy cập</h2><p>Quyền được kiểm tra lại ở backend cho mỗi truy vấn.</p></div></div>
            <div className="form-grid">
              <label>Phòng ban<select name="department_id" defaultValue={user?.department?.id ?? ""} disabled={user?.role !== "admin"}><option value="">Chọn phòng ban</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>{user?.role !== "admin" && <input type="hidden" name="department_id" value={user?.department?.id ?? ""} />}</label>
              <label>Phạm vi<select name="visibility" defaultValue="department"><option value="private">Chỉ mình tôi</option><option value="department">Trong phòng ban</option><option value="shared">Chia sẻ có chọn lọc</option><option value="company">Toàn doanh nghiệp</option></select></label>
              <label>Mức độ bảo mật<select name="security_level" defaultValue="internal"><option value="internal">Nội bộ</option><option value="confidential">Bảo mật</option><option value="restricted">Hạn chế</option></select></label>
            </div>
          </section>

          {error && <div className="notice error">{error}</div>}
          <div className="form-actions"><Link href="/documents" className="secondary-button">Hủy</Link><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Đang tải và lưu…" : "Tải lên & lập chỉ mục"}<UploadCloud size={18} /></button></div>
        </div>

        <aside className="upload-aside">
          <div className="aside-card dark"><LockKeyhole size={23} /><h3>Luồng xử lý an toàn</h3><ol><li><span>1</span>Lưu file gốc vào S3 private</li><li><span>2</span>Trích xuất text theo từng trang</li><li><span>3</span>Chia đoạn và tạo embedding</li><li><span>4</span>Lưu vector kèm quyền phòng ban</li></ol></div>
          <div className="aside-card"><h3>Mẹo đặt metadata</h3><p>Điền đúng số hiệu, loại và ngày ban hành giúp tìm kiếm công văn chính xác hơn khi kết hợp semantic search với bộ lọc.</p></div>
        </aside>
      </form>
    </div>
  );
}

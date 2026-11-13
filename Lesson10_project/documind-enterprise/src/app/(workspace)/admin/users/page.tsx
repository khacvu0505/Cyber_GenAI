"use client";

import {
  CheckCircle2,
  Edit3,
  Filter,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRoundCog,
  UserX,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, roleLabel } from "@/lib/format";
import type {
  AdminUser,
  AdminUserList,
  Department,
  User,
} from "@/lib/types";

type AccountDraft = {
  email: string;
  full_name: string;
  password: string;
  role: User["role"];
  department_id: string;
};

const emptyDraft: AccountDraft = {
  email: "",
  full_name: "",
  password: "",
  role: "employee",
  department_id: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Không thể hoàn thành yêu cầu.";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<AdminUserList | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<AccountDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [authLoading, router, user]);

  const loadUsers = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page_size: "100" });
    if (search.trim()) params.set("search", search.trim());
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("is_active", statusFilter);
    try {
      setResult(
        await apiFetch<AdminUserList>(`/admin/users?${params.toString()}`),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, statusFilter, user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    apiFetch<Department[]>("/departments")
      .then(setDepartments)
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 250);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const stats = useMemo(() => {
    const users = result?.items ?? [];
    return {
      active: users.filter((item) => item.is_active).length,
      managers: users.filter((item) => item.role === "manager").length,
      admins: users.filter((item) => item.role === "admin").length,
    };
  }, [result]);

  const openCreate = () => {
    setEditingUser(null);
    setDraft({
      ...emptyDraft,
      department_id: departments[0]?.id ?? "",
    });
    setError("");
    setEditorOpen(true);
  };

  const openEdit = (account: AdminUser) => {
    setEditingUser(account);
    setDraft({
      email: account.email,
      full_name: account.full_name,
      password: "",
      role: account.role,
      department_id: account.department?.id ?? "",
    });
    setError("");
    setEditorOpen(true);
  };

  const submitAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      email: draft.email.trim(),
      full_name: draft.full_name.trim(),
      role: draft.role,
      department_id: draft.role === "admin" ? null : draft.department_id,
      ...(editingUser ? {} : { password: draft.password }),
    };
    try {
      if (editingUser) {
        await apiFetch(`/admin/users/${editingUser.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess(`Đã cập nhật tài khoản ${payload.email}.`);
      } else {
        await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess(`Đã tạo tài khoản ${payload.email}.`);
      }
      setEditorOpen(false);
      await loadUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccount = async (account: AdminUser) => {
    const nextState = !account.is_active;
    const verb = nextState ? "mở khóa" : "khóa";
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} tài khoản ${account.email}?`)) {
      return;
    }
    setError("");
    try {
      await apiFetch(`/admin/users/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextState }),
      });
      setSuccess(`Đã ${verb} tài khoản ${account.email}.`);
      await loadUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const submitPasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resetTarget) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/admin/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      });
      setSuccess(`Đã đặt lại mật khẩu cho ${resetTarget.email}.`);
      setResetTarget(null);
      setNewPassword("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || user?.role !== "admin") {
    return <div className="table-loading">Đang kiểm tra quyền quản trị…</div>;
  }

  return (
    <div className="admin-users-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Quản trị hệ thống</span>
          <h1>Nhân sự &amp; phân quyền</h1>
          <p>Tạo tài khoản, gán phòng ban và kiểm soát quyền truy cập ứng dụng.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={17} /> Thêm nhân viên
        </button>
      </section>

      {error && <div className="notice error">{error}</div>}
      {success && (
        <div className="notice success">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={() => setSuccess("")} aria-label="Đóng thông báo">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="account-metrics" aria-label="Thống kê tài khoản">
        <article>
          <span className="account-metric-icon green"><UsersRound size={19} /></span>
          <div><strong>{result?.total ?? 0}</strong><span>Tổng tài khoản</span></div>
        </article>
        <article>
          <span className="account-metric-icon blue"><UserCheck size={19} /></span>
          <div><strong>{stats.active}</strong><span>Đang hoạt động</span></div>
        </article>
        <article>
          <span className="account-metric-icon orange"><UserRoundCog size={19} /></span>
          <div><strong>{stats.managers}</strong><span>Quản lý phòng ban</span></div>
        </article>
        <article>
          <span className="account-metric-icon purple"><ShieldCheck size={19} /></span>
          <div><strong>{stats.admins}</strong><span>Quản trị viên</span></div>
        </article>
      </section>

      <section className="document-toolbar account-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc email…"
          />
        </div>
        <div className="filter-control">
          <Filter size={17} />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Lọc vai trò"
          >
            <option value="">Mọi vai trò</option>
            <option value="admin">Quản trị hệ thống</option>
            <option value="manager">Quản lý phòng ban</option>
            <option value="employee">Nhân viên</option>
          </select>
        </div>
        <div className="filter-control">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Lọc trạng thái tài khoản"
          >
            <option value="">Mọi trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>
        <button className="icon-button" onClick={loadUsers} aria-label="Tải lại">
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </section>

      <section className="panel account-table-panel">
        <div className="account-table-head">
          <span>Nhân viên</span>
          <span>Phòng ban</span>
          <span>Vai trò</span>
          <span>Trạng thái</span>
          <span>Ngày tạo</span>
          <span>Thao tác</span>
        </div>
        {loading ? (
          <div className="table-loading">Đang tải danh sách nhân viên…</div>
        ) : result?.items.length ? (
          result.items.map((account) => (
            <div className="account-table-row" key={account.id}>
              <div className="account-identity">
                <span className="account-avatar">{account.full_name.charAt(0)}</span>
                <div><strong>{account.full_name}</strong><span>{account.email}</span></div>
              </div>
              <span className="account-department">
                {account.department ? (
                  <><i style={{ backgroundColor: account.department.color }} />{account.department.name}</>
                ) : "Toàn doanh nghiệp"}
              </span>
              <span className={`role-badge role-${account.role}`}>{roleLabel[account.role]}</span>
              <span className={account.is_active ? "account-state active" : "account-state locked"}>
                <i />{account.is_active ? "Hoạt động" : "Đã khóa"}
              </span>
              <time>{formatDate(account.created_at)}</time>
              <div className="row-actions account-actions">
                <button onClick={() => openEdit(account)} aria-label={`Sửa ${account.full_name}`} title="Chỉnh sửa">
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => { setResetTarget(account); setNewPassword(""); setError(""); }}
                  aria-label={`Đặt lại mật khẩu ${account.full_name}`}
                  title="Đặt lại mật khẩu"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  className={account.is_active ? "danger" : ""}
                  onClick={() => toggleAccount(account)}
                  aria-label={`${account.is_active ? "Khóa" : "Mở khóa"} ${account.full_name}`}
                  title={account.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                >
                  {account.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state small">
            <UsersRound size={24} />
            Không tìm thấy tài khoản phù hợp.
          </div>
        )}
      </section>

      {editorOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditorOpen(false)}>
          <section
            className="account-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-editor-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">{editingUser ? "Cập nhật quyền" : "Tài khoản mới"}</span>
                <h2 id="account-editor-title">{editingUser ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}</h2>
              </div>
              <button onClick={() => setEditorOpen(false)} aria-label="Đóng"><X size={19} /></button>
            </header>
            <form onSubmit={submitAccount}>
              <div className="account-form-grid">
                <label>
                  Họ và tên
                  <input
                    required
                    minLength={2}
                    value={draft.full_name}
                    onChange={(event) => setDraft({ ...draft, full_name: event.target.value })}
                    placeholder="Nguyễn Văn An"
                  />
                </label>
                <label>
                  Email công việc
                  <input
                    required
                    type="email"
                    value={draft.email}
                    onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                    placeholder="an@company.vn"
                  />
                </label>
                {!editingUser && (
                  <label className="span-2">
                    Mật khẩu tạm thời
                    <input
                      required
                      type="password"
                      minLength={8}
                      value={draft.password}
                      onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </label>
                )}
                <label>
                  Vai trò
                  <select
                    value={draft.role}
                    onChange={(event) => {
                      const role = event.target.value as User["role"];
                      setDraft({
                        ...draft,
                        role,
                        department_id:
                          role === "admin" ? "" : draft.department_id || departments[0]?.id || "",
                      });
                    }}
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="manager">Quản lý phòng ban</option>
                    <option value="admin">Quản trị hệ thống</option>
                  </select>
                </label>
                <label>
                  Phòng ban
                  <select
                    required={draft.role !== "admin"}
                    disabled={draft.role === "admin"}
                    value={draft.department_id}
                    onChange={(event) => setDraft({ ...draft, department_id: event.target.value })}
                  >
                    {draft.role === "admin" && <option value="">Toàn doanh nghiệp</option>}
                    {draft.role !== "admin" && !draft.department_id && <option value="">Chọn phòng ban</option>}
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="permission-note">
                <ShieldCheck size={17} />
                <span>
                  {draft.role === "admin" && "Admin có quyền truy cập và quản trị toàn hệ thống."}
                  {draft.role === "manager" && "Quản lý được quản trị tài liệu trong phòng ban được gán."}
                  {draft.role === "employee" && "Nhân viên chỉ truy cập tài liệu theo phạm vi và quyền được chia sẻ."}
                </span>
              </div>
              <footer>
                <button type="button" className="secondary-button" onClick={() => setEditorOpen(false)}>Hủy</button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Đang lưu…" : editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {resetTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setResetTarget(null)}>
          <section
            className="account-modal password-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-reset-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">Bảo mật tài khoản</span>
                <h2 id="password-reset-title">Đặt lại mật khẩu</h2>
              </div>
              <button onClick={() => setResetTarget(null)} aria-label="Đóng"><X size={19} /></button>
            </header>
            <form onSubmit={submitPasswordReset}>
              <p className="password-target">Tạo mật khẩu mới cho <strong>{resetTarget.email}</strong>.</p>
              <label className="password-field">
                Mật khẩu mới
                <input
                  required
                  autoFocus
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                />
              </label>
              <footer>
                <button type="button" className="secondary-button" onClick={() => setResetTarget(null)}>Hủy</button>
                <button className="primary-button" disabled={saving}>
                  <KeyRound size={16} /> {saving ? "Đang cập nhật…" : "Đặt lại mật khẩu"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

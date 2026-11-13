"use client";

import {
  BotMessageSquare,
  ChevronDown,
  FileArchive,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { roleLabel } from "@/lib/format";
import type { User } from "@/lib/types";

const navigation = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/documents", label: "Kho tài liệu", icon: FolderKanban },
  { href: "/upload", label: "Tải tài liệu", icon: UploadCloud },
  { href: "/assistant", label: "Trợ lý tri thức", icon: BotMessageSquare },
];

const adminNavigation = [
  { href: "/admin/users", label: "Nhân sự & phân quyền", icon: UsersRound },
];

function SidebarContent({
  user,
  pathname,
  onClose,
  onLogout,
}: {
  user: User;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><FileArchive size={21} strokeWidth={1.8} /></div>
        <div>
          <strong>DocuMind</strong>
          <span>Enterprise</span>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Đóng menu">
          <X size={20} />
        </button>
      </div>

      <div className="workspace-pill">
        <div className="workspace-icon"><ShieldCheck size={16} /></div>
        <div>
          <span>Không gian làm việc</span>
          <strong>{user.department?.name ?? "Toàn doanh nghiệp"}</strong>
        </div>
        <ChevronDown size={16} />
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        <span className="nav-caption">Quản lý</span>
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "nav-link active" : "nav-link"}
              onClick={onClose}
            >
              <item.icon size={19} strokeWidth={1.8} />
              {item.label}
              {item.href === "/assistant" && <span className="ai-chip">AI</span>}
            </Link>
          );
        })}
        {user.role === "admin" && (
          <>
            <span className="nav-caption admin-caption">Quản trị</span>
            {adminNavigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "nav-link active" : "nav-link"}
                  onClick={onClose}
                >
                  <item.icon size={19} strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="sidebar-security">
        <ShieldCheck size={18} />
        <div>
          <strong>Dữ liệu được phân quyền</strong>
          <span>Chỉ tìm kiếm trong tài liệu bạn được phép xem.</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="avatar">{user.full_name.charAt(0)}</div>
        <div className="user-meta">
          <strong>{user.full_name}</strong>
          <span>{roleLabel[user.role]}</span>
        </div>
        <button onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="app-loader">
        <div className="brand-mark"><FileArchive size={22} /></div>
        <span>Đang mở không gian làm việc…</span>
      </div>
    );
  }

  return (
    <div className="app-frame">
      <div className={mobileOpen ? "mobile-sidebar open" : "mobile-sidebar"}>
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
        <SidebarContent user={user} pathname={pathname} onClose={() => setMobileOpen(false)} onLogout={logout} />
      </div>
      <div className="desktop-sidebar"><SidebarContent user={user} pathname={pathname} onClose={() => setMobileOpen(false)} onLogout={logout} /></div>
      <main className="app-main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            <Menu size={22} />
          </button>
          <div className="global-search">
            <Search size={18} />
            <span>Tìm công văn, số hiệu, nội dung…</span>
            <kbd>⌘ K</kbd>
          </div>
          <Link href="/upload" className="topbar-upload">
            <UploadCloud size={17} />
            Tải lên
          </Link>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

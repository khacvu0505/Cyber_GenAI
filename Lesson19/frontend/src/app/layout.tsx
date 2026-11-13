import type { Metadata } from "next";

import { AuthProvider } from "@/lib/auth-context";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DocuMind Enterprise",
    template: "%s · DocuMind",
  },
  description: "Quản lý công văn và khai thác tri thức doanh nghiệp an toàn.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

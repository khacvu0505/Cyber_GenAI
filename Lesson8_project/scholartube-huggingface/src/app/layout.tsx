import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarTube Edu",
  description: "AI-powered academic course marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

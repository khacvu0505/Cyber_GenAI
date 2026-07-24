import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STEM Reasoning Lab",
  description: "AI reasoning coach for Vietnamese STEM students",
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

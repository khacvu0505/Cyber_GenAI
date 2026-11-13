import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalSight VAG",
  description: "Tra cứu tài liệu pháp lý dạng ảnh với AWS Textract và OpenAI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}


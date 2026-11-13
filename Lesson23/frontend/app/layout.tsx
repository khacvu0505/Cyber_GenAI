import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Secure RAG Access Control", description: "RAG authorization decision dashboard" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}

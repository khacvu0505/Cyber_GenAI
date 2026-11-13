import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProposalOps — AI Proposal Crew",
  description: "Đội ngũ AI phân tích yêu cầu, thiết kế giải pháp và soạn proposal B2B.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

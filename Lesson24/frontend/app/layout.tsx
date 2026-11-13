import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Augmented BI Copilot",
  description: "Connect a PostgreSQL or MySQL database and generate BI dashboards with natural language.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

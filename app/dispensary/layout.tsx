import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne  = Syne({ subsets: ["latin"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: "Dispensary Portal",
  description: "Marketing platform for dispensary operators",
  robots: { index: false, follow: false },
};

export default function DispensaryRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`dispensary-portal ${inter.variable} ${syne.variable} font-sans bg-surface-0 text-white antialiased`}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}

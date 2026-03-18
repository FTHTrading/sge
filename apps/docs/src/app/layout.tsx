import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SGE Alignment OS — Documentation",
  description: "Technical documentation for the SGE Alignment OS platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#0A0A0C] text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

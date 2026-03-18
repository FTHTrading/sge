import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { VoiceAIAssistant } from "@/components/ai/VoiceAIAssistant";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SGE Alignment OS",
  description:
    "Open Climate Infrastructure & Strategic Partner Alignment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen bg-[hsl(220,16%,4%)] text-white antialiased`}>
        {children}
        <VoiceAIAssistant />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechBuddy - AI-Powered Documentation Platform",
  description: "An AI-powered technical documentation platform built with Next.js. Upload documents, ask questions, and get instant answers.",
  keywords: ["TechBuddy", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI documentation", "RAG", "React"],
  authors: [{ name: "TechBuddy Team" }],
  openGraph: {
    title: "TechBuddy",
    description: "Your AI-Powered Technical Documentation Platform.",
    url: "https://your-deployment-url.com", // Remember to change this to your actual URL
    siteName: "TechBuddy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechBuddy",
    description: "Your AI-Powered Technical Documentation Platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
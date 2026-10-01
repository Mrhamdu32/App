import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LifeOS — Personal Command Center",
  description: "Unified productivity and operational system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0b0f19] text-white antialiased selection:bg-purple-500 selection:text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
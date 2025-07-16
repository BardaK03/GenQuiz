import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GenQuiz - Platformă Educațională",
  description: "Platformă educațională pentru învățare și testare interactivă",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <div className="w-full">
          <Sidebar />
          <main className="min-h-screen bg-gray-50 pl-[120px]">{children}</main>
        </div>
      </body>
    </html>
  );
}

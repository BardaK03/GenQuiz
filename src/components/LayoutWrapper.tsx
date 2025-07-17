"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Rutele pe care nu se afișează sidebar-ul
  const hideSidebarRoutes = ["/login", "/register"];

  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  if (shouldHideSidebar) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="w-full">
      <Sidebar />
      <main className="min-h-screen bg-gray-50 pl-[120px]">{children}</main>
    </div>
  );
}

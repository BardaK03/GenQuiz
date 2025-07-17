"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ConditionalSidebar() {
  const pathname = usePathname();

  // Rutele pe care nu se afișează sidebar-ul
  const hideSidebarRoutes = ["/login", "/register"];

  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  if (shouldHideSidebar) {
    return null;
  }

  return (
    <div className="w-full">
      <Sidebar />
      <main className="min-h-screen bg-gray-50 pl-[120px]">
        {/* Placeholder pentru children - va fi înlocuit în layout */}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Lecție", path: "/lectie" },
    { name: "test", path: "/test" },
    { name: "Resurse SmartLab", path: "/resurse" },
  ];

  return (
    <div className="h-screen w-[10%] min-w-[120px] bg-white border-r border-gray-200 shadow-sm flex flex-col py-8">
      <div className="px-4 mb-8">
        <h1 className="text-lg font-bold text-blue-600">Gen<span className="text-gray-800">Quizz</span></h1>
      </div>
      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center text-center
                ${isActive 
                  ? "bg-blue-100 text-blue-700 font-medium" 
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  isAdmin?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { name: "Lecție", path: "/lectie" },
    { name: "Test", path: "/test" },
    { name: "Lecții Salvate", path: "/saved-lessons" },
    { name: "Quiz-uri Salvate", path: "/saved-quizzes" },
    { name: "Resurse SmartLab", path: "/resurse" },
  ];

  const adminNavItems = [{ name: "🔧 Admin Panel", path: "/admin" }];

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUser(null);
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed top-0 left-0 h-screen w-[120px] bg-white border-r border-gray-200 shadow-sm flex flex-col py-8 z-50">
        <div className="px-4 mb-8">
          <h1 className="text-lg font-bold text-blue-600">
            Gen<span className="text-gray-800">Quiz</span>
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-[120px] bg-white border-r border-gray-200 shadow-sm flex flex-col py-8 z-50">
      <div className="px-4 mb-8">
        <h1 className="text-lg font-bold text-blue-600">
          Gen<span className="text-gray-800">Quiz</span>
        </h1>
      </div>
      <nav className="flex flex-col gap-2 px-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center text-center text-sm
                ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}

        {/* Admin section */}
        {user?.isAdmin && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center text-center text-sm
                    ${
                      isActive
                        ? "bg-red-100 text-red-700 font-medium"
                        : "text-gray-700 hover:bg-red-50"
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="mt-auto px-2">
        {user ? (
          <div className="space-y-2">
            <p className="text-xs text-center text-gray-500 truncate px-2">
              {user.first_name} {user.last_name}
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-center"
            >
              Deconectare
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="block w-full py-2 px-3 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-center"
          >
            Conectare
          </Link>
        )}
      </div>
    </div>
  );
}

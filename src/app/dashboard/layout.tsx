"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Briefcase,
  BarChart2,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReportsOpen, setIsReportsOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
    } else {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative Light Blob */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"
          } bg-[#0f172a]/95 backdrop-blur-sm border-r border-indigo-500/20 text-slate-300 flex flex-col transition-all duration-300 relative z-[60] shadow-[4px_0_24px_rgba(59,130,246,0.15)]`}
      >
        <div
          className={`flex items-center ${isSidebarOpen ? "gap-3 px-6" : "justify-center"
            } py-6 border-b border-indigo-500/20`}
        >
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="text-xl font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-wide truncate">
              Bulk Connections
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3.5 top-7 bg-slate-800 p-1.5 rounded-full border border-indigo-500/30 hover:bg-indigo-900 hover:border-indigo-400 hover:scale-110 transition-all z-10 shadow-lg"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {/* Orders Link */}
          <Link
            href="/dashboard"
            className={`w-full flex items-center ${isSidebarOpen ? "gap-3 px-6" : "justify-center"
              } py-3 text-sm font-medium transition-all group ${pathname === "/dashboard"
                ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-2 border-blue-500 shadow-[inset_2px_0_10px_rgba(59,130,246,0.1)]"
                : "hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-transparent border-l-2 border-transparent hover:border-blue-400"
              }`}
            title="Orders"
          >
            <Briefcase
              className={`w-5 h-5 flex-shrink-0 transition-colors ${pathname === "/dashboard"
                  ? "text-blue-400"
                  : "text-slate-400 group-hover:text-blue-400"
                }`}
            />
            {isSidebarOpen && (
              <span
                className={
                  pathname === "/dashboard"
                    ? "text-white font-bold"
                    : "text-slate-300 group-hover:text-white transition-colors"
                }
              >
                Orders
              </span>
            )}
          </Link>

          {/* Reports Section */}
          <div>
            <button
              onClick={() => {
                if (!isSidebarOpen) setIsSidebarOpen(true);
                else setIsReportsOpen(!isReportsOpen);
              }}
              className={`w-full flex items-center ${isSidebarOpen ? "gap-3 px-6" : "justify-center"
                } py-3 text-sm font-medium transition-all group ${isReportsOpen
                  ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-2 border-blue-500 shadow-[inset_2px_0_10px_rgba(59,130,246,0.1)]"
                  : "hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-transparent border-l-2 border-transparent hover:border-blue-400"
                }`}
              title="Reports"
            >
              <BarChart2
                className={`w-5 h-5 flex-shrink-0 transition-colors ${isReportsOpen
                    ? "text-blue-400"
                    : "text-slate-400 group-hover:text-blue-400"
                  }`}
              />
              {isSidebarOpen && (
                <>
                  <span
                    className={
                      isReportsOpen
                        ? "text-white font-bold"
                        : "text-slate-300 group-hover:text-white transition-colors"
                    }
                  >
                    Reports
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 ml-auto transition-transform flex-shrink-0 ${isReportsOpen
                        ? "rotate-180 text-blue-400"
                        : "text-slate-500"
                      }`}
                  />
                </>
              )}
            </button>
            {isSidebarOpen && isReportsOpen && (
              <div className="pl-14 py-2 space-y-3 border-l border-indigo-500/20 ml-8 mb-2 mt-1">
                <Link
                  href="/dashboard/reports/overview"
                  className={`block text-sm transition-colors ${pathname === "/dashboard/reports/overview"
                      ? "text-blue-400 font-bold"
                      : "text-slate-400 hover:text-blue-300"
                    }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/reports/order-reports"
                  className={`block text-sm transition-colors ${pathname === "/dashboard/reports/order-reports"
                      ? "text-blue-400 font-bold"
                      : "text-slate-400 hover:text-blue-300"
                    }`}
                >
                  Order Reports
                </Link>
                <Link
                  href="/dashboard/reports/logistics"
                  className={`block text-sm transition-colors ${pathname === "/dashboard/reports/logistics"
                      ? "text-blue-400 font-bold"
                      : "text-slate-400 hover:text-blue-300"
                    }`}
                >
                  Logistics
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div
          className={`p-4 border-t border-indigo-500/20 ${!isSidebarOpen && "flex flex-col items-center"
            }`}
        >
          <div
            className={`flex items-center ${isSidebarOpen
                ? "gap-3 p-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                : "justify-center"
              } rounded-xl mb-4 shadow-sm`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-inner">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate">
                  {user?.name || user?.email || "User"}
                </p>
                <p className="text-xs text-slate-400">
                  {user?.role || "Client"}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center ${isSidebarOpen ? "gap-3 px-2" : "justify-center w-full"
              } text-rose-400 hover:text-rose-300 transition-colors text-sm font-bold group`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">{children}</main>
    </div>
  );
}
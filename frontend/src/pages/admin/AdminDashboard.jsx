import React, { useEffect, useState, useRef } from "react";

import api from "../../api/axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth } from "../../utils/auth";
import {
  Users,
  BookOpen,
  UserCog,
  BarChart3,
  LogOut,
  Bell,
  ChevronRight,
  Home,
  Activity,
  TrendingUp,
  Menu,
  X,
  Sparkles,
  Calendar
} from "lucide-react";
import ManageStudents from "./ManageStudents";
import ManageTeachers from "./ManageTeachers";
import ManageClasses from "./ManageClasses";
import AdminAnalyticsWidget from "./AdminAnalyticsWidget";
import ChartCard from "../../components/ChartCard";

export default function AdminDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [trend, setTrend] = useState({ labels: [], values: [] });
  const [division, setDivision] = useState([]);
  const [timeRange, setTimeRange] = useState("7d");
  const notifRef = useRef(null);


  async function refreshAllDashboardData() {
    try {
      setLoadingStats(true);
      const [overviewRes, trendRes, divisionRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get(`/admin/analytics/attendance-trend?period=${timeRange}`),
        api.get(`/admin/analytics/class-performance?period=${timeRange}`),
      ]);
      setAnalytics(overviewRes.data.data);
      setTrend(trendRes.data.data);
      setDivision(divisionRes.data.data || []);
    } catch (e) {
      console.error("Failed to refresh dashboard", e);
    } finally {
      setLoadingStats(false);
    }
  }

  const glassCard = "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  const glassMainContent = "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get("/admin/notifications");
        const items = res.data.data || [];
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Notifications load error:", err);
      }
    }
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }

    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    refreshAllDashboardData();
  }, [timeRange]);

  const ranges = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
  ];

  function logout() {
    clearAuth();
    navigate("/login");
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { key: "students", label: "Students", icon: <Users className="w-4 h-4" /> },
    { key: "teachers", label: "Teachers", icon: <UserCog className="w-4 h-4" /> },
    { key: "classes", label: "Classes", icon: <BookOpen className="w-4 h-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const stats = [
    {
      label: "Total Students",
      value: loadingStats ? "—" : (analytics?.total_students ?? 0),
      subtitle: "Since last month",
      change: "+5%",
    },
    {
      label: "Total Teachers",
      value: loadingStats ? "—" : (analytics?.total_teachers ?? 0),
      subtitle: "Since last month",
      change: "+18%",
    },
    {
      label: "Total Sessions",
      value: loadingStats ? "—" : (analytics?.sessions_last_30 ?? 0),
      subtitle: "Since last month",
      change: "+2.3%",
    },
    {
      label: "Avg Attendance",
      value: loadingStats ? "—" :
        (analytics?.avg_attendance_last_30 !== undefined
          ? `${analytics.avg_attendance_last_30}%`
          : "0"),
      subtitle: "Since last month",
      change: "+2.3%", 
    },
  ];

  function renderDashboard() {
    const divisionValues = division.map((d) => d.attendance);
    const divisionTotal = divisionValues.reduce((a, b) => a + b, 0);

    return (
      <>
        {/* Top stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-5 sm:mb-6 mt-6 sm:mt-9">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`${glassCard} p-4 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-600">{s.label}</div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                    {s.value}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {s.subtitle}
                  </div>
                </div>
                <div className="ml-1">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white/70 flex items-center justify-center text-slate-700">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>

              {s.change && (
                <div className="text-xs text-emerald-500 mt-3">{s.change}</div>
              )}
            </div>
          ))}
        </div>

        {/* Charts area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-4">
          {/* Attendance trend (line) */}
          <div className={`${glassCard} p-4 lg:col-span-2`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-slate-600">Actual vs Planned</div>
                <div className="text-lg font-semibold text-slate-800">
                  Attendance trends
                </div>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500">
                Last 7 days
              </div>
            </div>

            {/* mobile: auto height; md+: fixed but not huge */}
            <div className="w-full rounded-xl bg-gradient-to-tr from-pink-50/40 to-cyan-50/40 px-3 py-2">
              <div className="h-52 sm:h-60 md:h-64 lg:h-72">
                {trend.labels.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    No trend data available
                  </div>
                ) : (
                  <ChartCard
                    type="line"
                    title=""
                    labels={trend.labels}
                    data={trend.values}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Workload by division (pie) */}
          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div>
                <div className="text-xs text-slate-600">Workload by Division</div>
                <div className="text-base font-semibold text-slate-800">
                  Weekly
                </div>
              </div>

              <div className="flex justify-end">
                <div className="inline-flex bg-white/60 rounded-full p-1 border border-white/70">
                  {ranges.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setTimeRange(r.value)}
                      className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full transition-colors ${timeRange === r.value
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white"
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full rounded-xl bg-gradient-to-tr from-emerald-50/40 to-teal-50/40 px-3 py-2">
              <div className="h-52 sm:h-60 md:h-64">
                {division.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    No division data available
                  </div>
                ) : divisionTotal === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    All divisions have 0% attendance
                  </div>
                ) : (
                  <ChartCard
                    type="pie"
                    title=""
                    labels={division.map((d) => d.name)}
                    data={divisionValues}
                  />
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Bottom: charts + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-6 h-83 sm:h-83">
          {/* Left big chart card */}
          <div className={`${glassCard} p-4 lg:col-span-2`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Attendance Overview
              </h3>
              <span className="text-[11px] sm:text-xs text-slate-500">
                Range: {timeRange.toUpperCase()}
              </span>
            </div>

            {/* Mobile: auto height + vertical stack, md+: 2 columns with fixed height */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-56">
              {/* Left: trend bar chart */}
              <div className="rounded-xl bg-gradient-to-tr from-pink-50/40 to-cyan-50/40 px-3 py-2 h-56 sm:h-60 md:h-full">
                {trend.labels.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                    No trend data
                  </div>
                ) : (
                  <ChartCard
                    type="bar"
                    title=""
                    labels={trend.labels}
                    data={trend.values}
                  />
                )}
              </div>

              {/* Right: class wise average attendance */}
              <div className="rounded-xl bg-gradient-to-tr from-indigo-50/40 to-sky-50/40 px-3 py-2 h-56 sm:h-60 md:h-full">
                {division.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">
                    No class performance data
                  </div>
                ) : (
                  <ChartCard
                    type="bar"
                    title=""
                    labels={division.map((d) => d.name)}
                    data={division.map((d) => d.attendance)}
                  />
                )}
              </div>
            </div>
          </div>


          {/* Recent Activity */}
          <div className={`${glassCard} p-4 space-y-3 mt-4 lg:mt-0`}>
            <div className="text-sm font-semibold text-slate-800">
              Recent Activity
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              {notifications.length === 0 ? (
                <div>No notifications</div>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full mt-1 bg-indigo-400" />
                    <div>
                      <div className="text-[13px] text-slate-800 font-medium">
                        {n.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {n.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();

      case "students":
        return (
          <div>
            <ManageStudents onStudentChanged={refreshAllDashboardData} />
          </div>
        );


      case "teachers":
        return (
          <div >
            <ManageTeachers />
          </div>
        );

      case "classes":
        return (
          <div >
            <ManageClasses />
          </div>
        );

      case "analytics":
        return (
          <div >
            <AdminAnalyticsWidget />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5e9ff] via-[#92aabf] to-[#92aabf] text-slate-900">
      {/* subtle top-left vignette to match image */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -left-32 -top-24 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-72 h-72 bg-gradient-to-tr from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-30 
    w-72 max-w-[80%] sm:w-80 lg:w-64
    lg:inset-y-4 lg:left-4
    rounded-none lg:rounded-2xl overflow-hidden
    bg-white/85 lg:bg-gradient-to-b lg:from-pink-100/65 lg:via-violet-100/55 lg:to-cyan-100/45
    backdrop-blur-xl
    shadow-[0_20px_60px_rgba(99,102,241,0.18)] border border-white/60 
    transform transition-transform duration-300
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >


          <div className="h-full flex flex-col">
            <div className="px-4 py-4 border-b border-white/20 flex items-center justify-between gap-3">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                </div>
                <div className="hidden xs:block">
                  <div className="text-base sm:text-lg font-semibold text-slate-800">
                    Admin Dashboard
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1">
                    Welcome back, {user?.name || "Admin"}
                  </div>
                </div>
              </Link>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg bg-white/40"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>


            <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);

                      // MOBILE FIX: tab click ke baad sidebar band karo
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
  ${active ? "bg-white/60 text-indigo-700 shadow-sm" : "text-slate-700/90 hover:bg-white/20"}`}
                  >

                    <span className={active ? "text-indigo-600" : "text-slate-400"}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {active && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                  </button>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-white/20">
              <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/40">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{user?.name || "Admin"}</div>
                  <div className="text-[11px] text-slate-600">Administrator</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/20 text-rose-600 hover:bg-white/30 rounded-xl text-sm font-medium border border-white/10 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-screen lg:pl-72 overflow-x-hidden">
          {/* Header */}
          <header className="mt-4 top-2 sm:top-4 z-20 px-3 sm:px-4 lg:px-8">
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/70 px-3 sm:px-4 py-2.5 sm:py-3.5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setIsSidebarOpen((v) => !v)}
                  className="lg:hidden p-2 rounded-lg bg-white/30"
                >
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
                {/* arrow + search */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    className="text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180 stroke-[2.5]" />
                  </button>
                  {/* <div className="hidden md:flex items-center bg-white/20 px-3 py-2 rounded-full border border-black/10">
                    <input
                      placeholder="Search..."
                      className="bg-transparent outline-none text-sm text-slate-700"
                    />
                  </div> */}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="relative" ref={notifRef}>
                  <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/30 px-3 py-1 text-xs text-indigo-700 border border-white/20">
                    <Activity className="w-3.5 h-3.5" />
                    Today's overview
                  </div>
                  <button
                    className="p-2 rounded-full bg-white/30 relative"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      if (unreadCount > 0) {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setUnreadCount(0);
                      }
                    }}
                  >
                    <Bell className="w-5 h-5 text-slate-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-1 ring-white" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white/80 border border-white/30 rounded-xl shadow-lg z-30 backdrop-blur p-2">
                      <div className="px-3 py-2 border-b border-white/20 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">
                          Notifications
                        </span>
                        <span className="text-xs text-slate-500">
                          {unreadCount} new
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className="px-3 py-3 border-b last:border-b-0 hover:bg-white/20 rounded-md transition"
                            >
                              <div className="text-sm font-medium text-slate-800">
                                {n.title}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {n.message}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {n.time}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                </div>

                <div className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || "A"}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
         <main className="flex-1 px-3 sm:px-4 lg:px-8 pt-4 pb-8 space-y-5 overflow-x-hidden">

            {renderContent()}
          </main>

          <footer className="px-3 sm:px-4 lg:px-8 mb-6">
            <div className="rounded-2xl bg-white/30 backdrop-blur-md border border-white/20 p-3 sm:p-4 text-[11px] sm:text-xs text-slate-600 flex flex-col sm:flex-row gap-1 sm:gap-0 justify-between">
              <div>Smart Attendance System v2.0</div>
              <div>© {new Date().getFullYear()} AttendWise. All rights reserved.</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

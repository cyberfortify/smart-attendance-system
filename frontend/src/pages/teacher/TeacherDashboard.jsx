import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../../utils/auth";
import {
  ClipboardCheck,
  Users,
  BookOpen,
  BarChart3,
  AlertTriangle,
  CalendarDays,
  LogOut,
  Bell,
  Menu,
  X,
  Home,
} from "lucide-react";
import api, { fetchClassDaily, fetchClassMonthly, fetchTeacherClasses } from "../../api/axios";
import ChartCard from "../../components/ChartCard";
import TakeAttendanceSection from "./TakeAttendanceSection";
import Toast from "../../components/Toast";

const STATIC_DEFAULTERS = [
  // 🔴 Critical (<60%)
  { student_id: 1, name: "Tejas Kumar", roll: "57", percent: 52, presents: 13, total_sessions: 25 },
  { student_id: 2, name: "Anish Sharma", roll: "12", percent: 48, presents: 12, total_sessions: 25 },
  { student_id: 3, name: "Aman Verma", roll: "26", percent: 55, presents: 14, total_sessions: 25 },
  { student_id: 4, name: "Neha Mishra", roll: "74", percent: 58, presents: 14, total_sessions: 24 },

  // 🟠 At Risk (60–69%)
  { student_id: 5, name: "Riya Patel", roll: "43", percent: 60, presents: 18, total_sessions: 30 },
  { student_id: 6, name: "Rahul Yadav", roll: "39", percent: 64, presents: 19, total_sessions: 30 },
  { student_id: 7, name: "Sahil Khan", roll: "14", percent: 66, presents: 16, total_sessions: 24 },
  { student_id: 8, name: "Aditi Joshi", roll: "82", percent: 68, presents: 19, total_sessions: 28 },
  { student_id: 9, name: "Ishita Banerjee", roll: "63", percent: 69, presents: 20, total_sessions: 29 },

  // 🟡 Borderline (70–74%)
  { student_id: 10, name: "Vikram Singh", roll: "08", percent: 70, presents: 21, total_sessions: 30 },
  { student_id: 11, name: "Pooja Nair", roll: "05", percent: 71, presents: 17, total_sessions: 24 },
  { student_id: 12, name: "Rohit Malhotra", roll: "31", percent: 72, presents: 18, total_sessions: 25 },
  { student_id: 13, name: "Kavya Iyer", roll: "59", percent: 73, presents: 21, total_sessions: 29 },
  { student_id: 14, name: "Sneha Gupta", roll: "91", percent: 74, presents: 19, total_sessions: 26 },

  // 🔴 More critical to balance charts
  { student_id: 15, name: "Nikhil Chauhan", roll: "22", percent: 50, presents: 12, total_sessions: 24 },
  { student_id: 16, name: "Arjun Reddy", roll: "47", percent: 56, presents: 14, total_sessions: 25 },

  // 🟠 Extra risk
  { student_id: 17, name: "Kunal Mehta", roll: "68", percent: 65, presents: 19, total_sessions: 29 },
  { student_id: 18, name: "Mohit Agarwal", roll: "11", percent: 67, presents: 20, total_sessions: 30 },

  // 🟡 Near threshold
  { student_id: 19, name: "Simran Kaur", roll: "90", percent: 74, presents: 20, total_sessions: 27 },
  { student_id: 20, name: "Tanvi Kulkarni", roll: "76", percent: 73, presents: 22, total_sessions: 30 },
];




export default function TeacherDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const refreshDashboard = () => loadDashboard();
  const [defaulters] = useState(STATIC_DEFAULTERS);
  const [defaulterLoading] = useState(false);
  const [defaulterClassId, setDefaulterClassId] = useState("");
  const topDefaulters = [...defaulters]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 10);

  const defaulterLabels = topDefaulters.map(d => d.name);
  const defaulterValues = topDefaulters.map(d => d.percent);
  const criticalCount = defaulters.filter(d => d.percent < 60).length;
  const riskCount = defaulters.filter(d => d.percent >= 60 && d.percent < 70).length;
  const borderlineCount = defaulters.filter(d => d.percent >= 70 && d.percent < 75).length;

  const riskLabels = ["Critical (<60%)", "At Risk (60–69%)", "Borderline (70–74%)"];
  const riskValues = [criticalCount, riskCount, borderlineCount];
  const sessionLabels = defaulters.map(d => d.name);
  const presentValues = defaulters.map(d => d.presents);
  const sessionValues = defaulters.map(d => d.total_sessions);






  const glassCard =
    "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { key: "attendance", label: "Take Attendance", icon: <ClipboardCheck className="w-4 h-4" /> },
    // { key: "students", label: "Students", icon: <Users className="w-4 h-4" /> },
    // { key: "assignments", label: "Assignments", icon: <BookOpen className="w-4 h-4" /> },
    { key: "defaulters", label: "Defaulters", icon: <AlertTriangle className="w-4 h-4" /> }
    // { key: "schedule", label: "Schedule", icon: <CalendarDays className="w-4 h-4" /> },
  ];

  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    upcomingClasses: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const statCards = [
    { label: "Total Students", value: stats.totalStudents },
    { label: "Today's Attendance", value: `${stats.todayAttendance}%` },
    { label: "Pending Tasks", value: stats.pendingTasks },
    { label: "Upcoming Classes", value: stats.upcomingClasses },
  ];


  // useEffect(() => {
  //   if (classes.length > 0 && !defaulterClassId) {
  //     setDefaulterClassId(classes[0].id);
  //   }
  // }, [classes]);

  // Load classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        const cls = await fetchTeacherClasses();
        setClasses(cls || []);
        if (cls && cls.length > 0) {
          setClassId(cls[0].id);
        }
      } catch (err) {
        setToast({ message: "Could not load your classes", variant: "error" });
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    // Load sirf jab classes available ho
    if (classes.length > 0) {
      loadDashboard();
    }
  }, [classes]);


  // summary 
  const [summary, setSummary] = useState({
    presentCount: 0,
    absentCount: 0,
  });

  function logout() {
    clearAuth();
    navigate("/login");
  }

  async function loadDashboard() {
    try {
      setLoadingStats(true);

      // 1. Dashboard stats (API only)
      try {
        const res = await api.get("/teacher/dashboard");
        const d = res.data?.data || {};
        setStats({
          totalStudents: d.total_students || 0,
          todayAttendance: d.today_attendance_rate || 0,
          pendingTasks: d.pending_tasks || 0,
          upcomingClasses: d.upcoming_classes || 0,
        });
      } catch (statsErr) {
        console.warn("Stats API unavailable");
        //  No fallback - 0 values
      }

      //  2. Attendance summary (API only)
      try {
        const sRes = await api.get("/teacher/attendance/summary");
        const s = sRes.data?.data || {};
        setSummary({
          presentCount: s.present_count || 0,
          absentCount: s.absent_count || 0,
        });
      } catch (summaryErr) {
        console.warn("Summary API unavailable");
        // No fallback - 0 values
      }

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  // useEffect(() => {
  //   if (!defaulterClassId) return;

  //   async function loadDefaulters() {
  //     setDefaulterLoading(true);
  //     try {
  //       const res = await api.get("/reports/defaulters", {
  //         params: {
  //           class_id: defaulterClassId,
  //           threshold: 75
  //         }
  //       });
  //       setDefaulters(res.data?.data || []);
  //     } catch (e) {
  //       console.warn("Defaulters API unavailable", e.response?.status);
  //       setDefaulters([]);
  //     } finally {
  //       setDefaulterLoading(false);
  //     }
  //   }

  //   loadDefaulters();
  // }, [defaulterClassId]);



  const totalRecords = summary.presentCount + summary.absentCount || 1;
  const presentPercent = Math.round((summary.presentCount * 100) / totalRecords);
  const absentPercent = 100 - presentPercent;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#f5e9ff] via-[#92aabf] to-[#92aabf] text-slate-900">
      {/* Background blur */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -left-32 -top-24 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64
          bg-white/80 h-screen backdrop-blur-xl border border-white/60
          shadow-[0_20px_60px_rgba(99,102,241,0.18)]
          transform transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:static lg:inset-y-4 lg:ml-4 lg:rounded-2xl`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="px-4 py-4 border-b border-white/30 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Teacher Panel</div>
                <div className="text-xs text-slate-600">
                  {user?.name || "Teacher"}
                </div>
              </div>
              <button
                className="lg:hidden p-2 bg-white/40 rounded-lg"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);

                      // Mobile pe sidebar auto-close
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
    ${active
                        ? "bg-white/60 text-indigo-700 shadow-sm"
                        : "text-slate-700/90 hover:bg-white/20"
                      }`}
                  >

                    <span className={active ? "text-indigo-600" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-white/30">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5
                bg-white/30 text-rose-600 rounded-xl text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden lg:pl-0">
          {/* HEADER */}
          <header className="px-4 sm:px-6 lg:px-8 pt-4">
            <div className={`${glassCard} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden p-2 bg-white/40 rounded-lg"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <div className="text-lg font-semibold">Dashboard</div>
                  <div className="text-xs text-slate-600">Overview</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-700" />
                <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
                  {user?.name?.charAt(0) || "T"}
                </div>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="px-4 sm:px-6 lg:px-8 pt-6 space-y-6 overflow-y-auto flex-1">
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((s, i) => (
                    <div key={i} className={`${glassCard} p-4`}>
                      <div className="text-xs text-slate-600">{s.label}</div>
                      <div className="text-2xl font-bold mt-2">
                        {loadingStats ? "…" : s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Second row: Overview + Present vs Absent + Defaulters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Present vs Absent summary (pie + stats) */}
                  <div className={`${glassCard} p-4 flex flex-col gap-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Overall Attendance Summary
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Present vs Absent Records
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <ChartCard
                        type="pie"
                        title=""
                        labels={["Present", "Absent"]}
                        data={[presentPercent, absentPercent]}
                        height={180}
                      />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {presentPercent}%
                              </div>
                              <div className="text-xs text-slate-600">
                                {summary.presentCount} present records
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-red-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {absentPercent}%
                              </div>
                              <div className="text-xs text-slate-600">
                                {summary.absentCount} absent records
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Total records: {summary.presentCount + summary.absentCount}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Top Defaulters (Static Preview) */}
                  <div className={`${glassCard} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          Top Defaulters
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Preview
                        </span>
                      </div>

                      {/* Disabled dropdown – static mode */}
                      {/* <select
                        disabled
                        className="text-xs px-2 py-1 bg-white/50 rounded-lg border opacity-60 cursor-not-allowed"
                      >
                        <option>All Classes</option>
                      </select> */}
                    </div>

                    {defaulters.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {defaulters.slice(0, 5).map((d) => (
                          <div
                            key={d.student_id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/60 border border-slate-100"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900">
                                {d.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Roll: {d.roll}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-rose-600">
                                {d.percent}%
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {d.presents}/{d.total_sessions}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
                        <p className="text-xs text-slate-500">
                          Defaulters preview not available
                        </p>
                      </div>
                    )}
                  </div>


                  {/* Top Defaulters
                  <div className={`${glassCard} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-slate-900">Top Defaulters</div>
                      <select
                        value={defaulterClassId}
                        onChange={(e) => setDefaulterClassId(Number(e.target.value))}
                        className="text-xs px-2 py-1 bg-white/50 rounded-lg border"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {defaulterLoading ? (
                      <p className="text-xs text-slate-500">Loading...</p>
                    ) : defaulters.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {defaulters.slice(0, 5).map((d, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/60 border border-slate-100">
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{d.name}</div>
                              <div className="text-[11px] text-slate-500">Roll: {d.roll}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-rose-600">
                                {d.percent}%
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {d.presents}/{d.total_sessions}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No defaulters found</p>
                    )}
                  </div> */}

                </div>

                {/* Third row: trend charts (daily/monthly) */}
                <DashboardReports
                  glassCard={glassCard}
                  classes={classes}
                  classId={classId}
                  setClassId={setClassId}
                />

              </>
            )}

            {/* Attendance TAB  */}
            {activeTab === "attendance" && (
              <TakeAttendanceSection
                glassCard={glassCard}
                onDone={async () => {
                  await new Promise(r => setTimeout(r, 300));
                  refreshDashboard();
                  setActiveTab("dashboard");
                }}
                showToast={(msg, variant = "success") =>
                  setToast({ message: msg, variant })
                }
              />
            )}

            {/* Defaulters TAB */}
            {activeTab === "defaulters" && (
              <div className={`${glassCard} p-6 space-y-6`}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Defaulters Report
                      </h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Preview
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm">
                      Static preview – attendance below 75%
                    </p>
                  </div>

                  {/* Disabled Class Selector */}
                  {/* <select
                    disabled
                    className="px-4 py-2 border border-slate-200 rounded-xl bg-white/60
                   text-sm font-medium min-w-[180px] opacity-60 cursor-not-allowed"
                  >
                    <option>All Classes</option>
                  </select> */}
                </div>

                {/* Table (Fixed height + scroll) */}
                <div className="relative overflow-x-auto">
                  <div className="max-h-[420px] overflow-y-auto rounded-2xl">
                    <table className="w-full bg-white/60 backdrop-blur-sm border border-slate-200">
                      <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <tr className="border-b border-slate-200">
                          <th className="text-left p-4 font-semibold text-slate-800">Student</th>
                          <th className="text-left p-4 font-semibold text-slate-800">Roll</th>
                          <th className="text-right p-4 font-semibold text-slate-800">Attendance</th>
                          <th className="text-right p-4 font-semibold text-slate-800">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaulters.length > 0 ? (
                          defaulters.map((d) => (
                            <tr
                              key={d.student_id}
                              className="hover:bg-white/80 transition-colors border-b border-slate-100 last:border-b-0"
                            >
                              <td className="p-4 font-medium text-slate-900">{d.name}</td>
                              <td className="p-4 text-sm text-slate-600">{d.roll}</td>
                              <td className="p-4 text-right">
                                <span className="text-rose-600 font-bold text-lg">
                                  {d.percent}%
                                </span>
                              </td>
                              <td className="p-4 text-right text-sm text-slate-600">
                                {d.presents}/{d.total_sessions}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-slate-500">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                              <div className="text-lg font-semibold mb-1">
                                Defaulters Preview Not Available
                              </div>
                              <p className="text-sm">
                                This report will be enabled in a future update
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* Attendance % Graph (Static Preview) */}
                <div className={`${glassCard} p-6`}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Top 10 Defaulters Attendance Overview
                    </h3>
                    <p className="text-sm text-slate-600">
                      Attendance percentage of students below threshold
                    </p>
                  </div>

                  {defaulters.length > 0 ? (
                    <ChartCard
                      type="bar"
                      title=""
                      labels={defaulterLabels}
                      data={defaulterValues}
                      height={320}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      No data available for visualization
                    </p>
                  )}
                </div>

                {/* Risk Analysis Charts (Side by Side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Pie Chart */}
                  <div className={`${glassCard} p-6`}>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Attendance Risk Distribution
                      </h3>
                      <p className="text-sm text-slate-600">
                        Breakdown of defaulters by risk level
                      </p>
                    </div>

                    {defaulters.length > 0 ? (
                      <ChartCard
                        type="pie"
                        title=""
                        labels={riskLabels}
                        data={riskValues}
                        height={260}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">
                        No data available for visualization
                      </p>
                    )}
                  </div>

                  {/* Bar Chart */}
                  <div className={`${glassCard} p-6`}>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Risk Level Comparison
                      </h3>
                      <p className="text-sm text-slate-600">
                        Number of students in each risk category
                      </p>
                    </div>

                    {defaulters.length > 0 ? (
                      <ChartCard
                        type="bar"
                        title=""
                        labels={riskLabels}
                        data={riskValues}
                        height={260}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">
                        No data available for visualization
                      </p>
                    )}
                  </div>

                </div>

                {/* Sessions vs Presents Trend (Static Preview) */}
                <div className={`${glassCard} p-6`}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Attendance Consistency Trend
                    </h3>
                    <p className="text-sm text-slate-600">
                      Comparison of attended sessions vs total sessions
                    </p>
                  </div>

                  {defaulters.length > 0 ? (
                    <ChartCard
                      type="line"
                      title=""
                      labels={sessionLabels}
                      data={presentValues}
                      height={320}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      No data available for visualization
                    </p>
                  )}
                </div>



                {/* CSV Export – Disabled */}
                {/* <div className="pt-4 border-t border-slate-200 text-sm text-slate-500">
                  CSV export will be available when defaulters module is enabled.
                </div> */}
              </div>
            )}
            {/* {activeTab === "students" && (
              <div className={glassCard + " p-4"}>
                Students UI will come here.
              </div>
            )} */}
            {/* {activeTab === "assignments" && (
              <div className={glassCard + " p-4"}>
                Assignments UI will come here.
              </div>
            )} */}


            {/* {activeTab === "schedule" && (
              <div className={glassCard + " p-4"}>
                Schedule UI will come here.
              </div>
            )} */}



          </main>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-4 right-4">
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}

    </div>
  );
}

/** Embedded daily/monthly trend charts row */
function DashboardReports({ glassCard, classes, classId, setClassId }) {
  const [activeReportTab, setActiveReportTab] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dailyData, setDailyData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);


  useEffect(() => {
    const t = new Date();
    const f = new Date();
    f.setDate(t.getDate() - 6);
    setTo(t.toISOString().slice(0, 10));
    setFrom(f.toISOString().slice(0, 10));
  }, []);


  async function loadDaily() {
    if (!classId || !from || !to) return;
    setLoadingDaily(true);
    try {
      const rows = await fetchClassDaily(classId, from, to);
      setDailyData(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDaily(false);
    }
  }

  async function loadMonthly() {
    if (!classId || !year) return;
    setLoadingMonthly(true);
    try {
      const rows = await fetchClassMonthly(classId, year);
      setMonthlyData(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMonthly(false);
    }
  }

  useEffect(() => { loadDaily(); }, [classId, from, to]);
  useEffect(() => { loadMonthly(); }, [classId, year]);

  const dailyLabels = (dailyData || []).map(d => d.date);
  const dailyValues = (dailyData || []).map(d => d.present);
  const monthlyLabels = (monthlyData || []).map(d => `M-${d.month}`);
  const monthlyValues = (monthlyData || []).map(d => d.present);

  return (
    <div className="space-y-4">
      {/* Heading card */}
      <div className={glassCard + " p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"}>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            Attendance Trend
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Daily and monthly attendance trends for the selected class.
          </p>
        </div>
        <div className="inline-flex self-start sm:self-auto rounded-xl bg-white/40 border border-white/60 p-1">
          <button
            onClick={() => setActiveReportTab("daily")}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${activeReportTab === "daily"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveReportTab("monthly")}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${activeReportTab === "monthly"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className={glassCard + " p-4 sm:p-6 space-y-4"}>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
          {/* Class dropdown */}
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-xs text-slate-600 mb-1">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm bg-white/80 border-slate-200"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `- ${c.section}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Daily filters */}
          {activeReportTab === "daily" && (
            <>
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-xs text-slate-600 mb-1">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white/80"
                />
              </div>

              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-xs text-slate-600 mb-1">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white/80"
                />
              </div>

              <button
                onClick={loadDaily}
                className="w-full sm:w-auto mt-1 sm:mt-0 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-medium shadow-sm"
              >
                {loadingDaily ? "Loading..." : "Load"}
              </button>
            </>
          )}

          {/* Monthly filters */}
          {activeReportTab === "monthly" && (
            <>
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-xs text-slate-600 mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white/80 w-full sm:w-24"
                />
              </div>

              <button
                onClick={loadMonthly}
                className="w-full sm:w-auto mt-1 sm:mt-0 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-medium shadow-sm"
              >
                {loadingMonthly ? "Loading..." : "Load"}
              </button>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="relative h-[320px] sm:h-[360px] lg:h-[420px] flex items-center">
          {activeReportTab === "daily" && (
            dailyData && dailyData.length > 0 ? (
              <ChartCard
                type="line"
                title=""
                labels={dailyLabels}
                data={dailyValues}
                height={360}
              />
            ) : (
              <p className="text-sm text-slate-500">No daily data.</p>
            )
          )}

          {activeReportTab === "monthly" && (
            monthlyData && monthlyData.length > 0 ? (
              <ChartCard
                type="bar"
                title=""
                labels={monthlyLabels}
                data={monthlyValues}
                height={360}
              />
            ) : (
              <p className="text-sm text-slate-500">No monthly data.</p>
            )
          )}
        </div>
      </div>
    </div>
  );

}

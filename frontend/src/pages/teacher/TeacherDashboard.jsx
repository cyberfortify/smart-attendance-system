import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
import api, {
  fetchClassDaily,
  fetchClassMonthly,
  fetchTeacherAssignments
} from "../../api/axios";
import ChartCard from "../../components/ChartCard";
import TakeAttendanceSection from "./TakeAttendanceSection";
import TeacherAcademicAssignments from "./TeacherAcademicAssignments";
import Toast from "../../components/Toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


export default function TeacherDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const refreshDashboard = () => loadDashboard();
  const [defaulters, setDefaulters] = useState([]);
  const [defaulterLoading, setDefaulterLoading] = useState(false);
  const [defaulterClassId, setDefaulterClassId] = useState("");
  const topDefaulters = [...defaulters]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 10);

  const [threshold, setThreshold] = useState(75);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const defaulterLabels = topDefaulters.map(d => d.name);
  const defaulterValues = topDefaulters.map(d => d.percent);
  const criticalCount = defaulters.filter(d => d.percent < 60).length;
  const riskCount = defaulters.filter(d => d.percent >= 60 && d.percent < 70).length;
  const borderlineCount = defaulters.filter(d => d.percent >= 70 && d.percent < 75).length;

  const riskLabels = ["Critical (<60%)", "At Risk (60–69%)", "Borderline (70–74%)"];
  const riskValues = [criticalCount, riskCount, borderlineCount];
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [selfAttendanceHistory, setSelfAttendanceHistory] = useState([]);
  const [markingLoading, setMarkingLoading] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);



  const glassCard =
    "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { key: "attendance", label: "Take Attendance", icon: <ClipboardCheck className="w-4 h-4" /> },
    // { key: "students", label: "Students", icon: <Users className="w-4 h-4" /> },
    // { key: "assignments", label: "Assignments", icon: <BookOpen className="w-4 h-4" /> },
    { key: "defaulters", label: "Defaulters", icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "academicAssignments", label: "Academic Assignments", icon: <BookOpen /> },
    { key: "myAttendance", label: "My Attendance", icon: <CalendarDays className="w-4 h-4" /> }
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


  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );


  async function loadNotifications() {
    try {
      const res = await api.get("/teacher/notifications");
      const items = res.data.data || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    } catch (err) {
      console.error("Notification load error:", err);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000); // every 10 seconds

    return () => clearInterval(interval);
  }, []);

  async function loadSelfAttendance() {
    try {
      const res = await api.get("/teacher/self-attendance-history");
      setSelfAttendanceHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadSummaryMonthly() {
    try {
      const res = await api.get("/teacher/self-attendance-monthly");
      setMonthlyChartData(res.data.data || []);
    } catch (err) {
      console.error("Monthly chart error:", err);
    }
  }
  async function loadMonthly() {
    const res = await api.get("/teacher/self-attendance-by-month", {
      params: { month: selectedMonth }
    });
    console.log("Heatmap Data:", res.data.data);
    setMonthlyData(res.data.data || []);
  }


  async function loadHeatmap() {
    const res = await api.get("/teacher/self-attendance-by-month", {
      params: { month: selectedMonth }
    });
    setHeatmapData(res.data.data || []);
  }
  async function loadSummary() {
    try {
      const res = await api.get("/teacher/self-attendance-summary");
      setAttendanceSummary(res.data.data);
    } catch (err) {
      console.error("Summary error:", err);
    }
  }

  useEffect(() => {
    if (activeTab === "myAttendance") {
      loadSelfAttendance();
      loadSummary();
      loadSummaryMonthly();
      loadHeatmap();
    }
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const data = await fetchTeacherAssignments();
        setAssignments(data);

        // Extract unique classes
        const uniqueClasses = [
          ...new Map(data.map(a => [a.class_id, a])).values()
        ];

        setClasses(uniqueClasses);

        if (uniqueClasses.length > 0) {
          setClassId(uniqueClasses[0].class_id);
        }

      } catch (err) {
        setToast({ message: "Could not load assignments", variant: "error" });
      }
    }

    loadAssignments();
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


  async function handleNotificationClick() {
    setNotifOpen(v => !v);

    if (unreadCount > 0) {
      try {
        await api.patch("/teacher/notifications/read");
        await loadNotifications();
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  }

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


      try {
        const pRes = await api.get("/teacher/performance");
        setPerformance(pRes.data.data);
      } catch (err) {
        console.warn("Performance API failed");
      }

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  // load defaulters
  async function loadDefaulters(
    classId,
    thresholdValue = threshold,
    subjectIdValue = subjectFilter
  ) {
    if (!classId) return;

    try {
      setDefaulterLoading(true);

      const res = await api.get("/reports/defaulters", {
        params: {
          class_id: classId,
          threshold: thresholdValue,
          subject_id: subjectIdValue || undefined
        }
      });

      setDefaulters(res.data?.data || []);

    } catch (err) {
      console.error("Defaulters error:", err);
      setDefaulters([]);
    } finally {
      setDefaulterLoading(false);
    }
  }

  // load defaulters jab class change ho
  useEffect(() => {
    if (classes.length > 0) {
      const firstClassId = classes[0].class_id;
      setDefaulterClassId(firstClassId);
      loadDefaulters(firstClassId);
    }
  }, [classes]);


  // Auto reload when class / threshold / subject change
  useEffect(() => {
    if (defaulterClassId) {
      loadDefaulters(defaulterClassId, threshold, subjectFilter);
    }
  }, [defaulterClassId, threshold, subjectFilter]);


  const totalRecords = summary.presentCount + summary.absentCount;

  const presentPercent =
    totalRecords > 0
      ? Math.round((summary.presentCount * 100) / totalRecords)
      : 0;

  const absentPercent =
    totalRecords > 0
      ? 100 - presentPercent
      : 0;

  const filteredDefaulters = useMemo(() => {
    return defaulters.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      String(d.roll).toLowerCase().includes(search.toLowerCase())
    );
  }, [defaulters, search]);

  const sessionLabels = filteredDefaulters.map(d => d.name);
  const presentValues = filteredDefaulters.map(d => d.presents);
  const sessionValues = filteredDefaulters.map(d => d.total_sessions);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setToast({ message: "Camera permission denied", variant: "error" });
    }
  }
  function stopCamera() {
    const video = videoRef.current;

    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;   // VERY IMPORTANT
    }
  }
  useEffect(() => {
    return () => {
      stopCamera();  // auto cleanup when component unmount
    };
  }, []);

  async function captureSelfAttendance() {
    setMarkingLoading(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    const formData = new FormData();
    formData.append("image", blob);

    try {
      await api.post("/teacher/self-attendance", formData);
      setToast({ message: "Attendance Marked!", variant: "success" });
      loadSelfAttendance();
    } catch {
      setToast({ message: "Face not matched", variant: "error" });
    }

    stopCamera();
    setShowCamera(false);
    setMarkingLoading(false);
  }


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
                <div className="relative">
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-2 rounded-full bg-white/30"
                  >
                    <Bell className="w-5 h-5 text-slate-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-1 ring-white" />
                    )}
                  </button>

                  {notifOpen &&
                    createPortal(
                      <div className="fixed top-20 right-8 w-80 bg-white shadow-2xl rounded-xl border z-[999999] max-h-96 overflow-y-auto">
                        <div className="px-4 py-3 border-b flex justify-between items-center">
                          <span className="text-sm font-semibold">Notifications</span>
                          <span className="text-xs text-slate-500">{unreadCount} new</span>
                        </div>

                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-500">
                              No notifications
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                className={`px-4 py-3 border-b last:border-b-0 text-sm ${n.is_read ? "bg-white" : "bg-indigo-50"
                                  }`}
                              >
                                <div className="font-medium text-slate-800">
                                  {n.title}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                  {n.message}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                  {new Date(n.created_at).toLocaleString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
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
                      {totalRecords > 0 ? (
                        <ChartCard
                          key={presentPercent + "-" + absentPercent}
                          type="pie"
                          title=""
                          labels={["Present", "Absent"]}
                          data={[presentPercent, absentPercent]}
                          height={180}

                        />
                      ) : (
                        <div className="text-sm text-slate-500 text-center">
                          No attendance data available
                        </div>
                      )}
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


                  {/* Top Defaulters */}
                  <div className={`${glassCard} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-slate-900">Top Defaulters</div>

                      <select
                        value={defaulterClassId}
                        onChange={(e) => {
                          setDefaulterClassId(Number(e.target.value));
                        }}
                        className="px-4 py-2 border border-slate-200 rounded-xl bg-white/60 text-sm"
                      >
                        {classes.map((c) => (
                          <option key={c.class_id} value={c.class_id}>
                            {c.class_name || c.name} {c.section ? `- ${c.section}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {defaulterLoading ? (
                      <div className="text-xs text-slate-500">Loading...</div>
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
                  </div>
                </div>

                {/* Third row: trend charts (daily/monthly) */}
                <DashboardReports
                  glassCard={glassCard}
                  classes={classes}
                  assignments={assignments}
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
                  await loadDashboard();   // reload stats immediately
                  await loadNotifications(); // reload notifications for any attendance-related alerts
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
                    <h2 className="text-2xl font-bold text-slate-900">
                      Defaulters Report
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Students below {threshold}% attendance
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    {/* Class Selector */}
                    <select
                      value={defaulterClassId}
                      onChange={(e) => {
                        setDefaulterClassId(Number(e.target.value));
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-xl bg-white/60 text-sm"
                    >
                      {classes.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                          {c.class_name || c.name} {c.section ? `- ${c.section}` : ""}
                        </option>
                      ))}
                    </select>

                    {/* Subject Filter */}
                    <select
                      value={subjectFilter}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSubjectFilter(val);
                        loadDefaulters(defaulterClassId, threshold, val);
                      }}
                      className="px-4 py-2 border rounded-xl bg-white/60 text-sm"
                    >
                      <option value="">All Subjects</option>
                      {assignments
                        .filter(a => a.class_id === defaulterClassId)
                        .map(a => (
                          <option key={a.subject_id} value={a.subject_id}>
                            {a.subject_name}
                          </option>
                        ))
                      }
                    </select>

                    {/* Threshold Slider */}
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-600">
                        Threshold: {threshold}%
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="90"
                        value={threshold}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setThreshold(val);
                          loadDefaulters(defaulterClassId, threshold, val);
                        }}
                      />
                    </div>

                    {/* CSV Export */}
                    <button
                      onClick={() => {
                        window.open(
                          `/api/reports/defaulters.csv?class_id=${defaulterClassId}&threshold=${threshold}`,
                          "_blank"
                        );
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm"
                    >
                      Export CSV
                    </button>

                  </div>
                </div>


                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-white/60 text-sm w-full sm:w-64"
                  />
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
                        {defaulterLoading ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-sm text-slate-500">
                              Loading...
                            </td>
                          </tr>
                        ) : filteredDefaulters.length > 0 ? (
                          filteredDefaulters.map((d) => (
                            <tr
                              key={d.student_id}
                              className="hover:bg-white/80 transition-colors border-b border-slate-100 last:border-b-0"
                            >
                              <td>
                                <button
                                  onClick={() => navigate(`/teacher/students/${d.student_id}`)}
                                  className="text-indigo-600 p-4 hover:underline"
                                >
                                  {d.name}
                                </button>
                              </td>
                              <td className="p-4 text-sm text-slate-600">{d.roll}</td>
                              <td className="p-4 text-right">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${d.percent < 60
                                    ? "bg-rose-100 text-rose-600"
                                    : d.percent < 70
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-yellow-100 text-yellow-700"
                                    }`}
                                >
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

                  {defaulterLoading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : defaulters.length > 0 ? (
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

                    {defaulterLoading ? (
                      <p className="text-sm text-slate-500">Loading...</p>
                    ) : defaulters.length > 0 ? (
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

                    {defaulterLoading ? (
                      <p className="text-sm text-slate-500">Loading...</p>
                    ) : defaulters.length > 0 ? (
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

                  {defaulterLoading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : defaulters.length > 0 ? (
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


            {activeTab === "myAttendance" && (
              <div className={`${glassCard} p-6 space-y-8`}>

                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      My Attendance
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Track your personal attendance performance
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowCamera(true);
                      setTimeout(startCamera, 300);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm"
                  >
                    Mark Attendance (Face)
                  </button>
                </div>

                {/* SUMMARY CARDS */}
                {attendanceSummary && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                      <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-medium">Total Days</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                          {attendanceSummary.total}
                        </p>
                      </div>

                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium">Present</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1">
                          {attendanceSummary.present}
                        </p>
                      </div>

                      <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                        <p className="text-xs text-rose-600 font-medium">Absent</p>
                        <p className="text-3xl font-bold text-rose-600 mt-1">
                          {attendanceSummary.absent}
                        </p>
                      </div>

                      <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <p className="text-xs text-yellow-600 font-medium">Attendance %</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-1">
                          {attendanceSummary.percentage}%
                        </p>
                      </div>

                    </div>

                    {/* PROGRESS BAR */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-2">
                        <span>Overall Performance</span>
                        <span>{attendanceSummary.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${attendanceSummary.percentage}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
                {/* Month Selector */}
                <div className="flex justify-end">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white text-sm"
                  />
                </div>


                {/* Monthly Chart + Heatmap Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* MONTHLY CHART */}
                  <div className="bg-white/70 rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4">
                      Monthly Attendance Overview
                    </h3>

                    {monthlyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyChartData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="present" fill="#16a34a" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="absent" fill="#dc2626" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No monthly attendance data available.
                      </p>
                    )}
                  </div>


                  {/* HEATMAP */}
                  <div className="bg-white/70 rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4">
                      Monthly Heatmap View
                    </h3>

                    <HeatmapCalendar
                      selectedMonth={selectedMonth}
                      heatmapData={heatmapData}
                    />
                  </div>

                </div>


                {/* ATTENDANCE HISTORY */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Attendance History
                  </h3>

                  <div className="overflow-y-auto max-h-72 rounded-2xl border border-slate-200 bg-white/70">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selfAttendanceHistory.length > 0 ? (
                          selfAttendanceHistory.map((r, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-3 text-slate-700">
                                {r.attendance_date}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${r.status === "PRESENT"
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-rose-100 text-rose-600"
                                    }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="p-6 text-center text-slate-500"
                            >
                              No attendance history found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "academicAssignments" && (
              <TeacherAcademicAssignments glassCard={glassCard} />
            )}
          </main>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96">
            <h3 className="text-lg font-bold mb-4">Face Verification</h3>

            <video ref={videoRef} autoPlay className="w-full h-60 bg-black rounded-lg" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={captureSelfAttendance}
                disabled={markingLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                {markingLoading ? "Verifying..." : "Capture"}
              </button>
            </div>
          </div>
        </div>
      )}
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
function DashboardReports({ glassCard, classes, assignments, classId, setClassId }) {
  const [activeReportTab, setActiveReportTab] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dailyData, setDailyData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [subjectId, setSubjectId] = useState("");


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
      const rows = await fetchClassDaily(classId, subjectId, from, to);
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
      const rows = await fetchClassMonthly(classId, subjectId, year);
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

  const filteredSubjects = assignments.filter(
    a => a.class_id === Number(classId)
  );
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
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name || c.name} {c.section ? `- ${c.section}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subject dropdown (filtered based on selected class) */}
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-xs text-slate-600 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm bg-white/80 border-slate-200"
              disabled={!classId}
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
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


function HeatmapCalendar({ selectedMonth, heatmapData }) {

  // Generate full month days
  const [year, month] = selectedMonth.split("-");
  const daysInMonth = new Date(year, month, 0).getDate();

  // Convert heatmapData to quick lookup
  const statusMap = {};
  heatmapData.forEach(d => {
    statusMap[d.day] = d.status;
  });

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      <div className="grid grid-cols-7 gap-2 text-xs text-center">
        {daysArray.map(day => {
          const status = statusMap[day];

          let bgClass = "bg-gray-200";

          if (status === "PRESENT") bgClass = "bg-green-500 text-white";
          if (status === "ABSENT") bgClass = "bg-red-500 text-white";

          return (
            <div
              key={day}
              className={`p-3 rounded-lg font-medium ${bgClass}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          Present
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-sm" />
          Absent
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded-sm" />
          No Record
        </div>
      </div>
    </>
  );
}
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ChartCard from "../../components/ChartCard";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserCog,
  Calendar,
  BarChart3,
  Download,
  Activity,
  Target,
  Award,
  Eye,
  ChevronRight,
  MoreVertical,
  CalendarDays
} from "lucide-react";

export default function AdminAnalytics() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [activeMetric, setActiveMetric] = useState("attendance");
  const [attendanceTrend, setAttendanceTrend] = useState({ labels: [], values: [] });
  const [classPerformance, setClassPerformance] = useState([]);
  const [pieData, setPieData] = useState({
    present: 0,
    absent: 0,
    present_count: 0,
    absent_count: 0,
    total: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [analyticsRes, trendRes, performanceRes, pieRes] = await Promise.all([
          api.get("/admin/analytics"),
          api.get(`/admin/analytics/attendance-trend?period=${timeRange}`),
          api.get(`/admin/analytics/class-performance?period=${timeRange}`),
          api.get(`/admin/analytics/attendance-pie?period=${timeRange}`),
        ]);

        setData(analyticsRes.data.data);
        setAttendanceTrend(trendRes.data.data);
        setClassPerformance(performanceRes.data.data);
        setPieData(pieRes.data.data);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [timeRange]);

  async function handleExportReport() {
    try {
      const res = await api.get("/admin/export/students", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `analytics_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export error:", err);
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: data.total_students,
      change: "+12%",
      trending: "up",
      icon: <Users className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    },
    {
      title: "Total Teachers",
      value: data.total_teachers,
      change: "+5%",
      trending: "up",
      icon: <UserCog className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
    },
    {
      title: "Sessions (30d)",
      value: data.sessions_last_30,
      change: "+18%",
      trending: "up",
      icon: <Calendar className="w-8 h-8" />,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
    },
    {
      title: "Avg Attendance",
      value: `${data.avg_attendance_last_30}%`,
      change: "+2.3%",
      trending: "up",
      icon: <BarChart3 className="w-8 h-8" />,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
    },
  ];

  const metrics = [
    { id: "attendance", label: "Attendance", icon: <Target /> },
    { id: "performance", label: "Performance", icon: <Award /> },
  ];

  const timeRanges = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "Year", value: "1y" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4 md:p-6 fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">

                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Analytics Dashboard
                </h1>
              </div>
              <p className="text-gray-600 mt-2">
                Monitor system performance and attendance trends
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin")}
                className="px-4 py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {metrics.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => setActiveMetric(metric.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeMetric === metric.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    {metric.icon}
                    {metric.label}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-10`}
                >
                  <div
                    className={`text-gradient bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {stat.icon}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {stat.trending === "up" ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${stat.trending === "up"
                        ? "text-emerald-600"
                        : "text-red-600"
                      }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {stat.title}
              </h3>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">Since last month</div>
            </div>
          ))}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {activeMetric === "attendance" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                {/* Attendance Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Attendance Overview
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Average attendance rate for the last {timeRange}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm text-gray-600">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-600">Absent</span>
                    </div>
                  </div>
                </div>

                {/* Present vs Absent + stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-4 sm:p-6">
                    <ChartCard
                      type="pie"
                      title="Present vs Absent"
                      labels={["Present", "Absent"]}
                      data={[pieData.present, pieData.absent]}
                      height={250} // ChartCard ke andar is height ko respect karo
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                        <div>
                          <div className="font-bold text-lg text-gray-900">
                            {pieData.present}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {pieData.present_count} present records
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-500 rounded-full" />
                        <div>
                          <div className="font-bold text-lg text-gray-900">
                            {pieData.absent}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {pieData.absent_count} absent records
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trend bar chart */}
                <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Attendance Trend
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Daily attendance rate for last {timeRange}
                      </p>
                    </div>
                  </div>

                  <div className="relative h-52 sm:h-56 lg:h-64">
                    <ChartCard
                      type="bar"
                      title="Attendance Trend"
                      labels={attendanceTrend.labels}
                      data={attendanceTrend.values}
                      height="100%" // ChartCard ko parent ke height ka use karne do
                    />
                  </div>
                </div>

              </div>
            )}

            {activeMetric === "performance" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Class Performance
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Attendance rates by class for {timeRange}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {classPerformance.map((cls) => (
                    <div
                      key={cls.class_id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${cls.attendance >= 90
                              ? "bg-emerald-100"
                              : cls.attendance >= 80
                                ? "bg-blue-100"
                                : "bg-amber-100"
                            }`}
                        >
                          <span
                            className={`text-sm font-bold ${cls.attendance >= 90
                                ? "text-emerald-600"
                                : cls.attendance >= 80
                                  ? "text-blue-600"
                                  : "text-amber-600"
                              }`}
                          >
                            {cls.attendance}%
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {cls.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cls.student_count} students
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${cls.attendance >= 90
                                ? "bg-emerald-500"
                                : cls.attendance >= 80
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                            style={{
                              width: `${Math.min(cls.attendance, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - simple static for now */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    System Health
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Overall system performance
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">Server Uptime</span>
                    <span className="text-sm font-medium text-gray-900">
                      99.8%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: "99.8%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      API Response Time
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      142ms
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Overview
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Quick system highlights
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Total Records (period)
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {pieData.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Present Percentage
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    {pieData.present}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Absent Percentage
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {pieData.absent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

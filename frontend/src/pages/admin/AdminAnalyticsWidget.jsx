import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export default function AdminAnalyticsWidget() {
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
            <div className="flex items-center justify-center py-10">
                <div className="text-center">
                    <div className="w-10 h-10 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading analytics...</p>
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
        <div className="space-y-6">
            {/* Header + controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Analytics Dashboard
                        </h2>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm">
                        Monitor system performance and attendance trends
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        {metrics.map((metric) => (
                            <button
                                key={metric.id}
                                onClick={() => setActiveMetric(metric.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeMetric === metric.id
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                        : "bg-white/70 text-gray-700 hover:bg-white border border-gray-200"
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
                                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${timeRange === range.value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-gray-200 text-xs sm:text-sm text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`${stat.bgColor} border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-10`}
                            >
                                <div
                                    className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
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
                                    className={`text-xs font-medium ${stat.trending === "up"
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium text-gray-600 mb-1.5">
                            {stat.title}
                        </h3>
                        <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
                            {stat.value}
                        </div>
                        <div className="text-[11px] text-gray-500">Since last month</div>
                    </div>
                ))}
            </div>

            {/* Main layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-5">
                    {activeMetric === "attendance" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            {/* Attendance overview */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                                        Attendance Overview
                                    </h2>
                                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                        Average attendance rate for the last {timeRange}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Present
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Absent
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pie + details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                <ChartCard
                                    type="pie"
                                    title="Present vs Absent"
                                    labels={["Present", "Absent"]}
                                    data={[pieData.present, pieData.absent]}
                                    height={230}
                                />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
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

                                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
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

                                    <div className="flex items-center justify-between px-2 pt-2 text-sm text-gray-600">
                                        <span>Total records</span>
                                        <span className="font-medium text-gray-900">
                                            {pieData.total}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Trend bar chart */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Attendance Trend
                                        </h2>
                                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                            Daily attendance rate for last {timeRange}
                                        </p>
                                    </div>
                                </div>
                                <ChartCard
                                    type="bar"
                                    title="Attendance Trend"
                                    labels={attendanceTrend.labels}
                                    data={attendanceTrend.values}
                                    height={200}
                                />
                            </div>
                        </div>
                    )}

                    {activeMetric === "performance" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                                        Class Performance
                                    </h2>
                                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                        Attendance rates by class for {timeRange}
                                    </p>
                                </div>
                                <button className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm flex items-center gap-1">
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

                {/* Right column */}
                <div className="space-y-5">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base sm:text-lg text-gray-900">
                                    System Health
                                </h3>
                                <p className="text-gray-600 text-xs sm:text-sm">
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

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                                <Eye className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base sm:text-lg text-gray-900">
                                    Overview
                                </h3>
                                <p className="text-gray-600 text-xs sm:text-sm">
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
    );
}

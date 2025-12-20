import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HashLink } from "react-router-hash-link";
import {
    Sparkles,
    Users,
    Clock,
    Shield,
    BarChart3,
    Smartphone,
    CheckCircle,
    ChevronRight,
    Play,
    Award,
    TrendingUp,
    Zap,
    Globe,
    Calendar,
    ArrowRight,
    Menu,
    X
} from "lucide-react";

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const features = [
        {
            icon: <Clock className="w-7 h-7 md:w-8 md:h-8" />,
            title: "Real-time Tracking",
            description: "Monitor attendance live with instant updates",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: <Shield className="w-7 h-7 md:w-8 md:h-8" />,
            title: "100% Secure",
            description: "Enterprise-grade security & data protection",
            color: "from-emerald-500 to-teal-500"
        },
        {
            icon: <BarChart3 className="w-7 h-7 md:w-8 md:h-8" />,
            title: "Advanced Analytics",
            description: "Detailed insights & performance metrics",
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: <Smartphone className="w-7 h-7 md:w-8 md:h-8" />,
            title: "Mobile First",
            description: "Works seamlessly on all devices",
            color: "from-amber-500 to-orange-500"
        }
    ];

    const stats = [
        { value: "99.8%", label: "System Uptime", icon: <Zap className="w-5 h-5" /> },
        { value: "10K+", label: "Active Users", icon: <Users className="w-5 h-5" /> },
        { value: "24/7", label: "Support", icon: <Globe className="w-5 h-5" /> },
        { value: "50+", label: "Features", icon: <Award className="w-5 h-5" /> }
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "School Principal",
            text: "Reduced administrative work by 70% with seamless attendance tracking.",
            rating: 5
        },
        {
            name: "Michael Chen",
            role: "University Director",
            text: "The analytics dashboard transformed how we monitor student engagement.",
            rating: 5
        },
        {
            name: "Priya Sharma",
            role: "Education Consultant",
            text: "Intuitive interface and powerful features. Our staff loves it!",
            rating: 5
        }
    ];

    const whyCards = [
        {
            icon: <Clock className="w-6 h-6 text-sky-600" />,
            title: "Save Time",
            text: "Automate daily attendance and free staff from manual work."
        },
        {
            icon: <Shield className="w-6 h-6 text-emerald-600" />,
            title: "Stay Accurate",
            text: "Reduce errors with centralized, consistent attendance data."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
            title: "See Insights",
            text: "Understand trends with simple, visual reports."
        },
        {
            icon: <Smartphone className="w-6 h-6 text-amber-500" />,
            title: "Anywhere Access",
            text: "Use AttendWise from web, tablet, or mobile on the go."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Top wave background */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-sky-50" />
                <div className="absolute -bottom-12 left-0 right-0 h-16 bg-white rounded-t-[40%]" />

                {/* Nav */}
                <Navbar />

                {/* Hero */}
                <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                            {/* Text */}
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-100 shadow-sm">
                                    <Sparkles className="w-4 h-4" />
                                    The smart way to track attendance
                                </span>

                                <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                                    Streamline your
                                    <span className="block text-sky-700">
                                        school operations
                                    </span>
                                </h1>

                                <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-xl">
                                    AttendWise helps schools and institutes record attendance,
                                    keep families informed, and understand student engagement in one simple platform.
                                </p>

                                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-sky-500 text-white font-semibold text-sm shadow-md hover:bg-sky-600"
                                    >
                                        Get Started
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                    <button className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-slate-700 text-sm font-medium border border-slate-200 hover:bg-slate-50">
                                        <Play className="w-4 h-4" />
                                        Watch how it works
                                    </button>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-sky-500" />
                                        10,000+ users
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                        Secure & GDPR-ready
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-indigo-500" />
                                        Works across devices
                                    </div>
                                </div>
                            </div>

                            {/* Illustration block (placeholder, like image reference) */}
                            <div className="relative">
                                <div className="relative rounded-3xl bg-sky-400/90 text-white p-6 sm:p-8 overflow-hidden shadow-2xl">
                                    <div className="absolute -right-20 -top-10 w-52 h-52 bg-sky-300/40 rounded-full blur-3xl" />
                                    <div className="absolute -left-10 bottom-0 w-40 h-40 bg-white/15 rounded-full blur-2xl" />

                                    <p className="text-xs uppercase tracking-[0.18em] text-sky-50 mb-2">
                                        LIVE DASHBOARD
                                    </p>
                                    <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                                        See attendance at a glance
                                    </h2>
                                    <p className="text-sm text-sky-50/90 mb-5 max-w-sm">
                                        Instant overview of classes, present students, and alerts so your team
                                        can react quickly every day.
                                    </p>

                                    <div className="space-y-3 text-xs sm:text-sm">
                                        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Today’s attendance
                                            </span>
                                            <span className="font-semibold">96%</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
                                            <span className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Active classes
                                            </span>
                                            <span className="font-semibold">32</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
                                            <span className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                On-time arrival
                                            </span>
                                            <span className="font-semibold text-emerald-100">+8% this month</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            </div>

            {/* “Why AttendWise” section */}
            <section className="bg-slate-50 py-12 sm:py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8 sm:mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Why AttendWise
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                            The all‑in‑one attendance platform built for modern schools and centers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {whyCards.map((item, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                                    {item.icon}
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                                    {item.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600">
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-14 sm:py-16 md:py-20 px-4 sm:px-5 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10 md:mb-14">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                            <span className="text-gray-900 block">
                                Everything You Need for
                            </span>
                            <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Modern Attendance Management
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                            Packed with features designed to save time, improve accuracy, and provide valuable insights.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 border border-gray-100"
                            >
                                <div
                                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-5 md:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform`}
                                >
                                    <div className="text-white">{feature.icon}</div>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2.5 md:mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-sm md:text-base text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 mb-3 md:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                <span className="text-xs sm:text-sm font-medium text-purple-700">
                                    Advanced Analytics
                                </span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-gray-900">
                                Data-Driven Insights for Better Decisions
                            </h3>
                            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                                {[
                                    "Real-time attendance tracking with live updates",
                                    "Comprehensive analytics dashboard with customizable reports",
                                    "Predictive analytics for identifying attendance patterns",
                                    "Automated notifications for low attendance",
                                    "Export data in multiple formats (PDF, Excel, CSV)"
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start gap-2.5 md:gap-3">
                                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm md:text-base text-gray-700">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <button className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm sm:text-base">
                                Explore Analytics
                            </button>
                        </div>

                        <div className="relative mt-4 lg:mt-0">
                            <div className="rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl">
                                <div className="space-y-4 md:space-y-5">
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 md:p-6 shadow-lg">
                                        <div className="flex items-center justify-between mb-3 md:mb-4">
                                            <div>
                                                <div className="text-xs sm:text-sm text-gray-600">
                                                    Attendance Rate
                                                </div>
                                                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                                    94.3%
                                                </div>
                                            </div>
                                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full"
                                                style={{ width: "94.3%" }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 md:p-6 shadow-lg">
                                        <div className="flex items-center justify-between mb-3 md:mb-4">
                                            <div>
                                                <div className="text-xs sm:text-sm text-gray-600">
                                                    Active Classes
                                                </div>
                                                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                                    42
                                                </div>
                                            </div>
                                            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            +3 this week
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-14 sm:py-16 md:py-20 px-4 sm:px-5 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-10 md:mb-14">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
                            Trusted by Educational Leaders Worldwide
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                            Join thousands of institutions that have transformed their attendance management.
                        </p>
                    </div>

                    {/* Testimonials */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="
                                    bg-white 
                                    rounded-2xl md:rounded-3xl 
                                    p-6 md:p-8 
                                    border border-gray-200
                                    shadow-lg hover:-translate-y-1 hover:shadow-2xl
                                    transition-all duration-300
                                "
                            >
                                {/* Rating */}
                                <div className="flex items-center gap-1 mb-4 md:mb-6">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <div key={i} className="w-4 h-4 md:w-5 md:h-5 text-amber-400">
                                            ★
                                        </div>
                                    ))}
                                </div>

                                {/* Text */}
                                <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                                    “{testimonial.text}”
                                </p>

                                {/* User */}
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                                    <div>
                                        <div className="font-semibold text-sm sm:text-base md:text-lg text-gray-900">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-500">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>


            {/* Footer */}
            <Footer />
        </div>
    );
}

import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Users, 
  BarChart3, 
  Shield, 
  Sparkles,
  Target,
  Heart,
  Globe,
  Award,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  BookOpen,
  GraduationCap,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Users as UsersIcon,
  Building,
  Star,
  ThumbsUp,
  Rocket,
  ShieldCheck,
  Cloud,
  Cpu,
  Database,
  Lock,
  Eye,
  Fingerprint
} from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  const stats = [
    { icon: <Users className="w-5 h-5" />, value: "10,000+", label: "Active Users", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: <Building className="w-5 h-5" />, value: "200+", label: "Institutions", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: <Globe className="w-5 h-5" />, value: "15+", label: "Countries", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: <Award className="w-5 h-5" />, value: "99.8%", label: "Uptime", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: <Clock className="w-5 h-5" />, value: "24/7", label: "Support", color: "text-cyan-600", bg: "bg-cyan-50" },
    { icon: <ShieldCheck className="w-5 h-5" />, value: "100%", label: "Secure", color: "text-red-600", bg: "bg-red-50" },
  ];

  const values = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Simplicity First",
      description: "Clean design so teachers and staff can start using AttendWise with minimal training.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Reliable Data",
      description: "Accurate, centralized attendance records that you can trust for reports and audits.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Support That Listens",
      description: "Fast, friendly support to help your institute get the most out of the platform.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Continuous Innovation",
      description: "Regular updates and new features based on real user feedback and needs.",
      color: "from-amber-500 to-orange-500"
    },
  ];

  const team = [
    {
      name: "Alex Johnson",
      role: "Founder & CEO",
      imageColor: "from-blue-400 to-cyan-400",
      bio: "Former education administrator with 10+ years in school management.",
      social: { twitter: "#", linkedin: "#" }
    },
    {
      name: "Sarah Chen",
      role: "Product Lead",
      imageColor: "from-purple-400 to-pink-400",
      bio: "EdTech specialist focused on user experience and product design.",
      social: { twitter: "#", linkedin: "#" }
    },
    {
      name: "Marcus Rivera",
      role: "CTO",
      imageColor: "from-emerald-400 to-teal-400",
      bio: "Software architect passionate about building scalable education solutions.",
      social: { twitter: "#", linkedin: "#" }
    },
    {
      name: "Priya Sharma",
      role: "Customer Success",
      imageColor: "from-amber-400 to-orange-400",
      bio: "Dedicated to helping schools implement and optimize their attendance systems.",
      social: { twitter: "#", linkedin: "#" }
    },
  ];

  const timeline = [
    { year: "2020", event: "AttendWise founded with a mission to digitize school attendance" },
    { year: "2021", event: "First 100 schools onboarded with positive feedback and rapid adoption" },
    { year: "2022", event: "Launched advanced analytics and mobile app for teachers" },
    { year: "2023", event: "Expanded to 15+ countries with multi-language support" },
    { year: "2024", event: "Introducing AI-powered insights and predictive analytics" },
  ];

  const technologies = [
    { icon: <Cloud className="w-5 h-5" />, name: "Cloud Infrastructure", description: "AWS & Google Cloud for reliability" },
    { icon: <Shield className="w-5 h-5" />, name: "Enterprise Security", description: "GDPR compliant & data encrypted" },
    { icon: <Cpu className="w-5 h-5" />, name: "Modern Stack", description: "React, Node.js & MongoDB" },
    { icon: <Database className="w-5 h-5" />, name: "Data Protection", description: "Regular backups & disaster recovery" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

        <Navbar />
        
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-sky-50/50" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="block text-slate-900">Built for the future of</span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                education technology
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              AttendWise is more than just attendance software—it's a complete digital transformation 
              platform designed to save time for educators, engage families, and provide administrators 
              with actionable insights into student engagement and institutional performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all font-medium"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-full hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all font-medium">
                <MessageSquare className="w-4 h-4" />
                Contact
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Our Mission</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                Transforming education through smart technology
              </h2>
              
              <div className="space-y-4 text-slate-600">
                <p>
                  Traditional attendance tracking is time-consuming, error-prone, and disconnected. 
                  AttendWise was founded to help educational institutions move beyond paper and spreadsheets 
                  into a modern, reliable system that works seamlessly across all devices.
                </p>
                <p>
                  From small coaching centers to large international schools, our goal is to eliminate 
                  administrative burden so your team can focus on what matters most-student success and 
                  educational outcomes.
                </p>
                <p>
                  We believe that every minute saved on administration is a minute gained for teaching, 
                  mentoring, and building stronger educational communities.
                </p>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Our Vision</h4>
                    <p className="text-sm text-slate-600">
                      To become the global standard for attendance management, recognized for innovation, 
                      reliability, and positive impact on educational institutions worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Who We Serve</h3>
                    <p className="text-blue-100">Educational institutions of all sizes</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: <BookOpen className="w-5 h-5" />, text: "K-12 Schools" },
                    { icon: <GraduationCap className="w-5 h-5" />, text: "Universities & Colleges" },
                    { icon: <UsersIcon className="w-5 h-5" />, text: "Coaching Centers" },
                    { icon: <Building className="w-5 h-5" />, text: "Corporate Training" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Our Values</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              What drives us forward
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              These principles guide every decision we make and every feature we build.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${value.color} mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <div className="text-white">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Built on Modern Tech</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                Secure, scalable, and future-proof technology
              </h2>
              
              <p className="text-slate-600 mb-6">
                We leverage cutting-edge technology to ensure your data is secure, accessible, 
                and always available when you need it.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {technologies.map((tech, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {tech.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{tech.name}</div>
                      <div className="text-sm text-slate-600">{tech.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Security First</div>
                    <div className="text-sm text-slate-600">
                      End-to-end encryption, regular security audits, and GDPR compliance
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Security Features</h3>
                    <p className="text-slate-300">Protecting your data at every level</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: <Lock className="w-4 h-4" />, text: "Bank-level 256-bit encryption" },
                    { icon: <Eye className="w-4 h-4" />, text: "Role-based access control" },
                    { icon: <Database className="w-4 h-4" />, text: "Daily automated backups" },
                    { icon: <Fingerprint className="w-4 h-4" />, text: "Multi-factor authentication" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section
      <section className="py-16 md:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full">
              <Users className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Our Team</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Meet the innovators
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A passionate team dedicated to transforming education through technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${member.imageColor} mb-4 flex items-center justify-center text-white text-2xl font-bold`}>
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                <div className="text-blue-600 font-medium mb-3">{member.role}</div>
                <p className="text-sm text-slate-600 mb-4">{member.bio}</p>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <Footer />

    </div>
  );
}
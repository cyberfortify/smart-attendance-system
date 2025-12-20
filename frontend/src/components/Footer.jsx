import { GraduationCap, Clock, Users, Calendar, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-16">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/15 rounded-2xl backdrop-blur shadow-xl">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  Attendance<span className="text-sky-100">Pro</span>
                </h3>
                <p className="text-sky-100/80 text-sm mt-1 max-w-sm">
                  Streamlined attendance management for modern schools
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-sky-100" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Home", path: "/" },
                { label: "Dashboard", path: "/login" },
                { label: "About", path: "/about" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-sky-100/80 hover:text-white transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2 uppercase tracking-wide">
              <Shield className="w-4 h-4 text-sky-100" />
              Features
            </h4>
            <ul className="space-y-3 text-sm text-sky-100/80">
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Student Management
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Real-time Attendance
              </li>
              <li>Reports & Analytics</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold mb-5 flex items-center gap-2 uppercase tracking-wide">
              <Users className="w-4 h-4 text-sky-100" />
              Support
            </h4>
            <p className="text-sky-100/80 text-sm mb-4">
              Need help? We’re always here.
            </p>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm">📧</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  support@attendancepro.com
                </p>
                <p className="text-xs text-sky-100/70">24/7 Support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-sky-100/70">
              © {currentYear} AttendancePro. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs font-medium text-sky-100/70 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

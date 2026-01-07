import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Menu
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null); 

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Attendance<span className="text-indigo-600">Pro</span>
            </span>
          </div>

          {/* Desktop Navigation + Login */}
          <div className="hidden md:flex items-center gap-8">
            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              {navLinks.map((link, index) =>
                index === 1 ? (
                  // Features link
                  <button
                    key={link.name}
                    onClick={() => {
                      if (link.path === "/") {
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" });
                      } else {
                        navigate(link.path);
                      }
                    }}
                    className="px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium text-sm rounded-lg hover:bg-indigo-50 transition-all duration-200"
                  >
                    {link.name}
                  </button>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.path)}
                    className="px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium text-sm rounded-lg hover:bg-indigo-50 transition-all duration-200"
                  >
                    {link.name}
                  </button>
                )
              )}
            </div>

            {/* Always show Login button */}
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
            >
              Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            {/* Mobile Navigation Links */}
            <div className="pt-4 pb-4 space-y-2">
              {navLinks.map((link, index) =>
                index === 1 ? (
                  <button
                    key={link.name}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (link.path === "/") {
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" });
                      } else {
                        navigate(link.path);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    {link.name}
                  </button>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate(link.path);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    {link.name}
                  </button>
                )
              )}
            </div>

            {/* Mobile Login button (always visible) */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow text-left"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

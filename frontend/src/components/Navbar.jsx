import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import {
  UserIcon,
  ChevronDownIcon,
  GraduationCap,
  Menu
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  // 1. DESKTOP NAVIGATION (setIsMobileMenuOpen नहीं है यहाँ)
  {
    navLinks.map((link) => (
      <button
        key={link.name}
        onClick={() => {
          if (link.name === 'Features') {
            const element = document.getElementById('features');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            navigate(link.path);
          }
        }}
        className="px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium text-sm rounded-lg hover:bg-indigo-50 transition-all duration-200"
      >
        {link.name}
      </button>
    ))
  }

  // 2. MOBILE NAVIGATION (यहाँ setIsMobileMenuOpen है)
  {
    navLinks.map((link) => (
      <button
        key={link.name}
        onClick={() => {
          setIsMobileMenuOpen(false);  // Mobile menu बंद करें
          if (link.name === 'Features') {
            const element = document.getElementById('features');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            navigate(link.path);
          }
        }}
        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
      >
        {link.name}
      </button>
    ))
  }


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

          {/* Desktop Navigation & Auth */}
          <div className="hidden md:flex items-center gap-8">
            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              {navLinks.map((link, index) => (
                index === 1 ? (  // Features link (index 1)
                  <button
                    key={link.name}
                    onClick={() => {
                      if (link.path === '/') {
                        document.getElementById('features')?.scrollIntoView({
                          behavior: 'smooth'
                        });
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
              ))}
            </div>


            {/* User Menu */}
            <div className="flex items-center gap-4 ml-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-700 hidden lg:block">
                      {user.name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate("/dashboard");
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Profile Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
                >
                  Login
                </button>
              )}
            </div>
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
            {/* Mobile Navigation Links */}
            <div className="pt-4 pb-4 space-y-2">
              {navLinks.map((link, index) => (
                index === 1 ? (  // Features link
                  <button
                    key={link.name}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (link.path === '/') {
                        document.getElementById('features')?.scrollIntoView({
                          behavior: 'smooth'
                        });
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
              ))}
            </div>


            {/* Mobile User Menu */}
            {user ? (
              <div className="pt-2 space-y-2 border-t border-gray-100" ref={dropdownRef}>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Profile Settings
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <button
                  onClick={() => {
                    navigate("/login");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow text-left"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

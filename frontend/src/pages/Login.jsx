import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, ChevronRight,
  Loader2, AlertCircle, X, Rocket
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  // const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // if (rememberMe) {
    //   localStorage.setItem("remember_email", email);
    // } else {
    //   localStorage.removeItem("remember_email");
    // }


    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, user } = res.data.data || {};

      if (!access_token || !user) {
        throw new Error("Invalid response format");
      }

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "TEACHER") navigate("/teacher");
      else navigate("/student");
      
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Invalid credentials. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // useEffect(() => {
  //   const savedEmail = localStorage.getItem("remember_email");
  //   if (savedEmail) {
  //     setEmail(savedEmail);
  //     setRememberMe(true);
  //   }
  // }, []);


  function handleClose() {
    navigate("/");
  }

  return (
    <>
      <style>{`
        html, body { 
          overflow: hidden; 
          height: 100vh; 
        }
      `}</style>

      <div className="
  h-screen flex items-center justify-center px-4
  relative overflow-hidden
  bg-gradient-to-br from-slate-200 via-blue-200/40 to-indigo-300/30
">

        {/* Floating blobs (depth ke liye) */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl" />

        {/* Glass overlay */}
        <div className="
    absolute inset-0
    bg-white/35
    backdrop-blur-2xl
    border border-white/60
  " />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-20 p-2.5 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg border border-white/60 hover:bg-white hover:shadow-xl text-gray-700 hover:scale-105 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact Glass Form - Perfect Height */}
        <div className="w-full max-w-sm">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden h-fit">
            {/* Top Bar */}
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-purple-400" />

            <div className="p-5 sm:p-6 space-y-4">
              {/* Compact Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                <p className="text-xs text-gray-600">Enter your credentials</p>
              </div>

              {/* Error - Compact */}
              {error && (
                <div className="p-3 bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-xl text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-800 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Compact Form */}
              <form onSubmit={handleLogin} className="space-y-3">
                {/* Email - Compact */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-3 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all shadow-sm"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password - Compact */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-700">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-10 pr-10 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Options - Compact */}
                <div className="flex items-center justify-between pt-1">
                  {/* <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                    />

                    <span>Remember</span>
                  </label> */}
                  {/* <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Forgot?
                  </button> */}
                </div>

                {/* Submit Button - Compact */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onMouseEnter={() => !isLoading && setIsHovering(true)}
                  onMouseLeave={() => !isLoading && setIsHovering(false)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all overflow-hidden ${isLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl hover:scale-[1.02]"
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ChevronRight className={`w-4 h-4 ${isHovering ? 'translate-x-1' : ''}`} />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Footer - Ultra Compact */}
              <div className="pt-4 border-t border-gray-200/40 text-center text-xs">
                <p className="text-gray-600">
                  No account? <button className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => navigate("/contact")}>Contact admin</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

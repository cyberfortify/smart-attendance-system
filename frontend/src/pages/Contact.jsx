import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle,
  Shield,
  Zap,
  User,
  School,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  MailCheck,
  PhoneCall,
  Map,
  HelpCircle,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    institute: "",
    email: "",
    phone: "",
    message: "",
    inquiryType: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Floating animation for background elements
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        institute: "",
        email: "",
        phone: "",
        message: "",
        inquiryType: "general"
      });
      
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  const inquiryTypes = [
    { value: "general", label: "General Inquiry", icon: <HelpCircle className="w-4 h-4" /> },
    { value: "support", label: "Technical Support", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

        <Navbar />
      {/* Animated Background */}
      <div className="gradient-mesh"></div>
      <div className="floating-particles">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              background: `radial-gradient(circle, ${i % 3 === 0 ? 'rgba(59, 130, 246, 0.2)' : i % 3 === 1 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(14, 165, 233, 0.2)'})`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="block text-slate-900">Get in touch with</span>
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              our team
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have questions or need a demo? Our team is ready to help you transform your attendance management.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Contact Form */}
          <div id="contact-here" className="animate-slide-in-left">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Send us a message</h2>
                    <p className="text-blue-100 text-sm">We'll respond within 24 hours</p>
                  </div>
                </div>
              </div>

              {isSubmitted && (
                <div className="m-4 md:m-6 p-4 md:p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900 text-sm md:text-base">Message sent successfully!</h3>
                      <p className="text-emerald-700 text-sm">We'll contact you within 24 hours.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3 text-slate-400" />
                        Full Name *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 rounded-xl border ${errors.name ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm`}
                      placeholder="John Smith"
                    />
                    {errors.name && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1 mb-1">
                        <School className="w-3 h-3 text-slate-400" />
                        Institute Name
                      </div>
                    </label>
                    <input
                      type="text"
                      name="institute"
                      value={formData.institute}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="Your school or organization"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1 mb-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        Email Address *
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 rounded-xl border ${errors.email ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1 mb-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-1 mb-1">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      Inquiry Type
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {inquiryTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${formData.inquiryType === type.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}
                      >
                        <input
                          type="radio"
                          name="inquiryType"
                          value={type.value}
                          checked={formData.inquiryType === type.value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className={`w-2.5 h-2.5 rounded-full border ${formData.inquiryType === type.value ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`} />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      How can we help? *
                    </div>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-3 py-2.5 rounded-xl border ${errors.message ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none`}
                    placeholder="Tell us about your requirements..."
                  />
                  {errors.message && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {errors.message}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative flex items-center justify-center gap-2 text-sm md:text-base">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                <p className="text-xs text-slate-500 text-center">
                  By submitting, you agree to our Privacy Policy. Your details are kept confidential.
                </p>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 animate-slide-in-right">
            {/* Contact Details */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MailCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Email Support</div>
                    <div className="text-slate-600 text-sm">support@attendwise.app</div>
                    <div className="text-xs text-slate-500 mt-1">Response within 24 hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Phone Support</div>
                    <div className="text-slate-600 text-sm">+1 (555) 123-4567</div>
                    <div className="text-xs text-slate-500 mt-1">Mon-Fri, 9AM-6PM EST</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Map className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Office Location</div>
                    <div className="text-slate-600 text-sm">Remote-first team</div>
                    <div className="text-xs text-slate-500 mt-1">Serving clients worldwide</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              Ready to transform your attendance management?
            </h2>
            <p className="text-blue-100 text-sm md:text-base mb-6 max-w-xl mx-auto">
              Join thousands of institutions using AttendWise for smarter attendance tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-full hover:bg-slate-100 transition-all font-bold text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent border border-white text-white rounded-full hover:bg-white/10 transition-all font-bold text-sm"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :root {
          --mouse-x: 50%;
          --mouse-y: 50%;
        }

        .gradient-mesh {
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at calc(var(--mouse-x) + 20%) calc(var(--mouse-y) - 20%), rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            radial-gradient(circle at calc(var(--mouse-x) - 20%) calc(var(--mouse-y) + 20%), rgba(14, 165, 233, 0.04) 0%, transparent 50%);
          transition: all 0.3s ease-out;
          pointer-events: none;
          z-index: 1;
        }

        .floating-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .floating-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-15px) translateX(10px);
          }
          50% {
            transform: translateY(-8px) translateX(-10px);
          }
          75% {
            transform: translateY(-12px) translateX(15px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .bg-grid-white\/10 {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}
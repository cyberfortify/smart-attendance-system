export default function Toast({ message, variant = "success", onClose }) {
  const colors = {
    success: {
      bg: "bg-emerald-500/20",
      icon: "text-emerald-400",
      border: "border-emerald-300/50"
    },
    error: {
      bg: "bg-rose-500/20", 
      icon: "text-rose-400",
      border: "border-rose-300/50"
    },
    warning: {
      bg: "bg-amber-500/20",
      icon: "text-amber-400", 
      border: "border-amber-300/50"
    }
  };

  const config = colors[variant] || colors.success;

  return (
    <div className="fixed top-20 right-6 z-[9999] max-w-sm w-full animate-in slide-in-from-right-4 fade-in duration-300">
      <div 
        className={`
          ${config.bg} backdrop-blur-2xl
          ${config.border} border-2 border-white/30
          bg-white/80 shadow-2xl shadow-black/20
          rounded-3xl p-5 flex items-start gap-4
          hover:shadow-3xl hover:scale-[1.02] transition-all duration-200
          ring-2 ring-white/50 ring-opacity-50
        `}
      >
        {/* Icon */}
        <div className={`w-6 h-6 flex-shrink-0 mt-0.5 ${config.icon}`}>
          {variant === "success" && (
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {variant === "error" && (
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {variant === "warning" && (
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-semibold text-slate-900 leading-relaxed line-clamp-2">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 ml-auto rounded-2xl bg-white/50 hover:bg-white/70 
                     backdrop-blur-sm transition-all duration-200 
                     border border-white/40 hover:border-white/60
                     hover:scale-110 active:scale-95 flex-shrink-0
                     group hover:shadow-lg"
          aria-label="Close toast"
        >
          <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                  d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

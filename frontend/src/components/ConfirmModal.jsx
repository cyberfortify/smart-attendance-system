export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="
    bg-white/90 backdrop-blur-2xl border border-white/40
    rounded-3xl shadow-2xl shadow-black/20 ring-1 ring-white/50
    w-full max-w-md mx-4 p-6 sm:p-8
    hover:shadow-3xl hover:scale-[1.01] transition-all duration-200
    animate-in slide-in-from-bottom-4 fade-in duration-300
  ">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center border-4 border-indigo-200/50">
          <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 text-center mb-3 leading-tight">
          {title}
        </h3>

        {/* Message */}
        <p className="text-slate-600 text-center mb-8 leading-relaxed px-4">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="
              flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200/50
              bg-white/50 backdrop-blur-sm hover:bg-white/70
              text-slate-700 font-semibold text-sm shadow-lg hover:shadow-xl
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              hover:border-slate-300/70
            "
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="
              flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600
              hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm
              shadow-xl hover:shadow-2xl ring-2 ring-indigo-500/30
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              backdrop-blur-sm
            "
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

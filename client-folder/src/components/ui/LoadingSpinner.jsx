export default function LoadingSpinner({
  size = 'md',
  className = '',
  text = 'Loading...',
  variant = 'spinner' // 'spinner' | 'skeleton'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  if (variant === 'skeleton') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10"></div>
          </div>
          <div className="flex justify-center mb-6">
            <div className="h-10 w-32 bg-white/10 rounded-xl"></div>
          </div>
          <div className="h-8 bg-white/10 rounded mb-2"></div>
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-white/10 rounded"></div>
            <div className="h-6 w-20 bg-white/10 rounded"></div>
          </div>
          <div className="h-10 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg className="w-full h-full text-emerald-400" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && (
        <p className="mt-3 text-sm text-slate-300 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
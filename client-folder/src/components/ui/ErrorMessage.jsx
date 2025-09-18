export default function ErrorMessage({
  message,
  onRetry,
  className = '',
  variant = 'default' // 'default' | 'minimal' | 'card'
}) {
  if (!message) return null;

  if (variant === 'minimal') {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-red-400 text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 text-red-400">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Something went wrong</h3>
        <p className="text-slate-400 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors duration-200"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <div className="w-24 h-24 text-red-400 mb-6">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-200 mb-3">Oops! Something went wrong</h2>
      <p className="text-slate-400 text-center max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors duration-200"
        >
          Try again
        </button>
      )}
    </div>
  );
}
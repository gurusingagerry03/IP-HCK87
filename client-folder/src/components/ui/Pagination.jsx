export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext = true,
  hasPrev = true,
  maxVisible = 5,
  className = '',
  showFirstLast = true
}) {
  if (totalPages <= 1) return null;

  const getPaginationRange = () => {
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePageChange = (page) => {
    const next = Math.max(1, Math.min(page, totalPages));
    onPageChange(next);
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrev || currentPage <= 1}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          {/* First page + ellipsis */}
          {showFirstLast && currentPage > 3 && totalPages > 5 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="w-12 h-12 rounded-xl font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
              >
                1
              </button>
              {currentPage > 4 && <span className="text-white/40 px-2">...</span>}
            </>
          )}

          {/* Page numbers */}
          {getPaginationRange().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-12 h-12 rounded-xl font-semibold transition-all duration-300 ${
                currentPage === page
                  ? 'bg-gradient-to-r from-accent to-orange-500 text-white'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Last page + ellipsis */}
          {showFirstLast && currentPage < totalPages - 2 && totalPages > 5 && (
            <>
              {currentPage < totalPages - 3 && (
                <span className="text-white/40 px-2">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="w-12 h-12 rounded-xl font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNext || currentPage >= totalPages}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
import { motion } from 'framer-motion';

export default function SearchFilter({
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  searchPlaceholder = "Search...",
  filterLabel = "Filter",
  filterPlaceholder = "All",
  searchLabel = "Search",
  className = '',
  layout = 'grid', // 'grid' | 'flex' | 'vertical'
  animate = true,
  children
}) {
  const containerClass = {
    grid: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    flex: 'flex flex-col sm:flex-row gap-6',
    vertical: 'space-y-6'
  }[layout];

  const filterSelectClass = layout === 'grid' ? 'w-full lg:w-80' : 'w-full sm:w-80';
  const filterContainerClass = layout === 'grid' ? 'lg:justify-self-end' : '';

  const SearchFilterContent = () => (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 ${className}`}>
      <div className={containerClass}>
        {/* Search Input */}
        <div>
          <label className="block text-white/70 text-sm font-medium mb-3">{searchLabel}</label>
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-5 py-4 pl-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</div>
          </div>
        </div>

        {/* Filter Dropdown */}
        {filterOptions.length > 0 && (
          <div className={filterContainerClass}>
            <label className="block text-white/70 text-sm font-medium mb-3">{filterLabel}</label>
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className={`${filterSelectClass} appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer`}
            >
              <option value="" className="bg-gray-800">
                {filterPlaceholder}
              </option>
              {filterOptions.map((option, i) => (
                <option
                  key={i}
                  value={typeof option === 'object' ? option.value : option}
                  className="bg-gray-800"
                >
                  {typeof option === 'object' ? option.label : option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom children (additional filters, etc.) */}
        {children}
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <SearchFilterContent />
      </motion.div>
    );
  }

  return (
    <div className="mb-12">
      <SearchFilterContent />
    </div>
  );
}
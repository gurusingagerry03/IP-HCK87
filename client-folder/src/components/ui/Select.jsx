import { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer transition-all duration-300';

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  const selectClasses = `
    ${baseClasses}
    ${errorClasses}
    ${className}
  `.trim();

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-white/70 text-sm font-medium mb-3">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          <option value="" className="bg-gray-800">
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option
              key={index}
              value={typeof option === 'object' ? option.value : option}
              className="bg-gray-800"
            >
              {typeof option === 'object' ? option.label : option}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
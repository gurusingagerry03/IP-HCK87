import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  type = 'text',
  ...props
}, ref) => {
  const baseClasses = 'w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300';

  const paddingClasses = icon
    ? iconPosition === 'left'
      ? 'px-5 py-4 pl-12'
      : 'px-5 py-4 pr-12'
    : 'px-5 py-4';

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  const inputClasses = `
    ${baseClasses}
    ${paddingClasses}
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
        {icon && (
          <div className={`absolute ${iconPosition === 'left' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-white/40`}>
            {icon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
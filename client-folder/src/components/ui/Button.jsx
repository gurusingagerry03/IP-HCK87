import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    // Primary gradient button (accent colors)
    primary: 'bg-gradient-to-r from-accent to-orange-500 text-white hover:from-orange-500 hover:to-accent focus:ring-accent',

    // Secondary button
    secondary: 'bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:ring-white/50',

    // Success button
    success: 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 hover:scale-105 focus:ring-green-500',

    // Info/Blue button
    info: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 hover:scale-105 focus:ring-blue-500',

    // Danger/Red button
    danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 hover:scale-105 focus:ring-red-500',

    // Favorite button
    favorite: 'bg-red-500 border-red-500 text-white border-2',
    'favorite-outline': 'bg-white/10 border-white/20 text-white/60 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 border-2',

    // Ghost button
    ghost: 'text-white hover:bg-white/10 focus:ring-white/30',

    // Outline button
    outline: 'border border-white/30 text-white hover:bg-white/10 focus:ring-white/30',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const iconElement = icon && (
    <span className={`${iconSizeClasses[size]} ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`}>
      {icon}
    </span>
  );

  const loadingSpinner = (
    <div className={`${iconSizeClasses[size]} border-2 border-white/30 border-t-white rounded-full animate-spin ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`} />
  );

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {loading && iconPosition === 'left' && loadingSpinner}
      {!loading && icon && iconPosition === 'left' && iconElement}

      {children}

      {loading && iconPosition === 'right' && loadingSpinner}
      {!loading && icon && iconPosition === 'right' && iconElement}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
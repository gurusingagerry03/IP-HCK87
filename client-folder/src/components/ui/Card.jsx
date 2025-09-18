export default function Card({
  children,
  className = '',
  variant = 'default', // 'default' | 'glass' | 'bordered'
  padding = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  hover = true,
  ...props
}) {
  const baseClasses = 'rounded-3xl transition-all duration-500';

  const variantClasses = {
    default: 'bg-white/5 backdrop-blur-sm border border-white/10',
    glass: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20',
    bordered: 'bg-white border border-gray-200 shadow-lg'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const hoverClasses = hover && variant !== 'bordered'
    ? 'hover:from-white/15 hover:to-white/10 hover:border-accent/30'
    : hover && variant === 'bordered'
    ? 'hover:shadow-xl'
    : '';

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${hoverClasses}
    ${className}
  `.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
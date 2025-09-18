// Performance mode - disable heavy animations for testing
export const PERFORMANCE_MODE = true; // Set to true untuk disable animations

// Simple motion component that doesn't animate when performance mode is on
export const SimpleMotion = ({ children, className, ...props }) => {
  if (PERFORMANCE_MODE) {
    return <div className={className}>{children}</div>;
  }
  return <motion.div className={className} {...props}>{children}</motion.div>;
};
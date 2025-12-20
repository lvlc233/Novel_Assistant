import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  rounded?: 'default' | 'full' | 'none';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// 按钮组件，用于触发操作或导航
const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  rounded = 'default',
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 focus:ring-accent-primary',
    secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-hover focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-surface-hover text-text-secondary focus:ring-gray-500',
    outline: 'border border-border-primary bg-transparent hover:bg-surface-hover text-text-primary focus:ring-gray-500',
    danger: 'bg-error text-white hover:bg-error/90 focus:ring-error',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10 p-2',
  };

  const roundness = {
    default: 'rounded-md',
    full: 'rounded-full',
    none: 'rounded-none',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${roundness[rounded]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;

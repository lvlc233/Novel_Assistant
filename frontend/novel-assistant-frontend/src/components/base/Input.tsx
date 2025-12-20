import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// 输入组件，用于用户输入文本或选择文件
const Input: React.FC<InputProps> = ({
  className = '',
  error,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full rounded-md border border-border-primary bg-surface-white py-2 px-3 text-sm placeholder-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50
            transition-all duration-200
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;

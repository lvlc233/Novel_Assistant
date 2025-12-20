import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, ArrowUp } from 'lucide-react';
import Button from './Button';

interface BottomInputProps {
  placeholder?: string;
  onSubmit: (value: string, files?: File[]) => void;
  onFileUpload?: (files: File[]) => void;
  enableShortcuts?: boolean;
  disabled?: boolean;
  loading?: boolean;
  position?: 'fixed' | 'static' | 'absolute';
  className?: string;
}

// 底部输入组件，用于用户与 AI 助手进行交互
const BottomInput: React.FC<BottomInputProps> = ({
  placeholder = '输入消息...',
  onSubmit,
  onFileUpload,
  enableShortcuts = true,
  disabled = false,
  loading = false,
  position = 'fixed',
  className = '',
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // Max height 120px
      textareaRef.current.style.height = `${value ? newHeight : 44}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`
      ${position === 'fixed' ? 'fixed bottom-12 left-0 right-0 z-50' : 'w-full'} 
      pointer-events-none
      ${className}
    `}>
      <div className={`
        mx-auto flex items-end gap-2 
        ${position === 'fixed' ? 'max-w-3xl px-4' : 'w-full'}
        pointer-events-auto
      `}>
        
        {/* Input Wrapper */}
        <div className="
          flex-1 relative 
          bg-surface-primary/50 backdrop-blur-sm 
          border border-border-primary/60 
          shadow-[0_8px_30px_rgb(0,0,0,0.04)]
          rounded-[26px]
          transition-all duration-200
          hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
          hover:bg-surface-primary/80
          focus-within:bg-surface-white
          focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          focus-within:border-border-primary
        ">
          <textarea
            ref={textareaRef}
            rows={1}
            className="
              w-full bg-transparent 
              py-3 pl-5 pr-12 
              text-sm text-text-primary 
              placeholder-text-secondary/50 
              focus:outline-none 
              resize-none 
              max-h-[120px] 
              overflow-y-auto
              rounded-[22px]
              scrollbar-hide
            "
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            style={{ minHeight: '44px' }}
          />
          
          {/* Send Button */}
          <div className="absolute right-1.5 bottom-1.5">
             <button
                onClick={handleSubmit}
                disabled={!value.trim() || disabled || loading}
                className={`
                  flex items-center justify-center
                  w-8 h-8 rounded-full
                  transition-all duration-200
                  ${value.trim() 
                    ? 'bg-[#2A2A2A] text-white hover:bg-black shadow-md transform hover:scale-105' 
                    : 'bg-transparent text-text-secondary/30 cursor-not-allowed'}
                `}
             >
                <ArrowUp className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomInput;

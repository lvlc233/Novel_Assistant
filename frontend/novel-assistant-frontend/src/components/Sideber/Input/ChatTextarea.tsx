import React, { forwardRef } from 'react';

interface ChatTextareaProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  placeholder?: string;
}

const ChatTextarea = forwardRef<HTMLTextAreaElement, ChatTextareaProps>(
  ({ value, onChange, onKeyDown, disabled, placeholder }, ref) => (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder || '输入 … Shift+Enter 换行'}
      className="chat-textarea"
    />
  )
);
ChatTextarea.displayName = 'ChatTextarea';
export default ChatTextarea;
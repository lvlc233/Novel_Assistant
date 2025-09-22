import React from 'react';
import { FiMessageCircle, FiPlus } from 'react-icons/fi';

interface NewChatButtonProps {
  onClick: () => void;
}

export default function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <button
      type="button"
      aria-label="新建会话"
      onClick={onClick}
      className="new-chat-btn"
    >
      <FiMessageCircle className="bubble-icon" />
    </button>
  );
}
import React from 'react';
import { FiSend } from 'react-icons/fi';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function SendButton({ onClick, disabled }: SendButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="send-button"
    >
      <FiSend className="send-icon" />

    </button>
  );
}
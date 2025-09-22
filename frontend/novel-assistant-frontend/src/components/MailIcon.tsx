"use client";

import React from 'react';

interface MailIconProps {
  onClick?: () => void;
}

const MailIcon: React.FC<MailIconProps> = ({ onClick }) => {
  return (
    <button
      className="mail-icon-button"
      onClick={onClick}
      aria-label="邮件"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mail-icon-svg"
      >
        <rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M2 6L12 13L22 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
};

export default MailIcon;
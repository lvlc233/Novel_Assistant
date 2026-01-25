"use client";

import React from 'react';

interface MailIconProps {
  onClick?: () => void;
}

const MailIcon: React.FC<MailIconProps> = ({ onClick }) => {
  return (
    <button
      className="
        fixed top-5 right-5 w-14 h-14 bg-surface-white border-2 border-border-primary rounded-full
        flex items-center justify-center cursor-pointer z-[9999]
        transition-all duration-300 shadow-card-soft
        hover:bg-surface-secondary hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-card-hover
        active:translate-y-0 active:shadow-button
        md:top-4 md:right-4 md:w-12 md:h-12
        sm:top-2.5 sm:right-2.5 sm:w-11 sm:h-11
      "
      onClick={onClick}
      aria-label="邮件"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-text-secondary transition-colors duration-200 group-hover:text-text-primary w-6 h-6 md:w-5 md:h-5 sm:w-[18px] sm:h-[18px]"
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
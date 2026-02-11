
"use client";
import React from 'react';
import { Mail } from 'lucide-react';
import { useMail } from '@/contexts/MailContext';

export const MailButton: React.FC = () => {
  const { toggleMailbox, unreadCount } = useMail();

  return (
    <button
      onClick={toggleMailbox}
      className="relative p-3 bg-white rounded-full shadow-sm hover:bg-white hover:scale-110 hover:shadow-md transition-all group z-50"
      aria-label="打开信箱"
    >
      <Mail className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
      
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
           {/* Optional: Show number if needed, but dot is cleaner for small badge */}
        </span>
      )}
    </button>
  );
};


"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useMail } from '@/contexts/MailContext';
import { X, MessageSquare } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { latestNotification, clearNotification, openMailbox } = useMail();
  const [visible, setVisible] = useState(false);
  const [displayContent, setDisplayContent] = useState('');

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(clearNotification, 300); // Wait for animation
  }, [clearNotification]);

  // Handle new notification
  useEffect(() => {
    if (latestNotification) {
      setVisible(true);
      setDisplayContent('');
      
      // Typewriter effect
      let i = 0;
      const text = latestNotification.content;
      const timer = setInterval(() => {
        setDisplayContent(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(timer);
      }, 30); // Speed of typing

      // Auto dismiss after 8 seconds
      const dismissTimer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => {
        clearInterval(timer);
        clearTimeout(dismissTimer);
      };
    }
  }, [latestNotification, handleClose]);

  const handleClick = () => {
    openMailbox();
    handleClose();
  };

  if (!latestNotification && !visible) return null;

  return (
    <div 
      className={`
        fixed right-6 top-20 z-40
        w-80 bg-white/90 backdrop-blur-md 
        border border-gray-200 shadow-xl rounded-xl 
        overflow-hidden transition-all duration-500 ease-in-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}
      `}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare size={12} className="text-accent-primary" />
            </div>
            <span className="font-semibold text-sm text-gray-900">
              {latestNotification?.senderId}
            </span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
        
        <div 
          onClick={handleClick}
          className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
        >
          {displayContent}
          <span className="animate-pulse">|</span>
        </div>
      </div>
      
      {/* Progress bar or time indicator could go here */}
      <div className="h-1 bg-gray-100 w-full">
         <div className={`h-full bg-accent-primary/20 transition-all duration-[8000ms] ease-linear ${visible ? 'w-full' : 'w-0'}`} />
      </div>
    </div>
  );
};

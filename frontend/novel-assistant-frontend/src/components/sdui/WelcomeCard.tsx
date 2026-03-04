import React from 'react';

interface WelcomeCardProps {
  user_name?: string;
  message?: string;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ user_name, message }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg mb-6">
      <h2 className="text-2xl font-bold mb-2">Welcome back, {user_name || 'Creator'}!</h2>
      <p className="text-blue-100 opacity-90">{message || 'Ready to continue your creative journey?'}</p>
    </div>
  );
};

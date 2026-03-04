"use client";
import React from 'react';
import { useMail } from '@/contexts/MailContext';

interface AgentSidebarItemProps {
  agentId?: string;
  name?: string;
  avatar?: string;
  role?: string;
  defaultPluginId?: string;
}

export const AgentSidebarItem: React.FC<AgentSidebarItemProps> = ({ 
  agentId, 
  name = "Agent", 
  avatar,
  role = "Assistant",
  defaultPluginId
}) => {
  const { currentFilter, setFilter, closeMailbox } = useMail();
  const id = agentId || defaultPluginId;
  
  if (!id) return null;

  const isSelected = currentFilter === id;

  const handleClick = () => {
    setFilter(id);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group ${
        isSelected 
          ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-surface-secondary' 
          : 'hover:scale-105 opacity-80 hover:opacity-100'
      }`}
      title={name}
    >
      {avatar ? (
         <img src={avatar} alt={name} className="w-full h-full rounded-xl object-cover shadow-sm" />
      ) : (
         <div className={`w-full h-full rounded-xl flex items-center justify-center text-surface-white font-bold text-sm shadow-sm
           ${id === 'system' ? 'bg-accent-primary' : 'bg-gray-400'}
         `}>
           {name?.substring(0, 1).toUpperCase()}
         </div>
      )}
      
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-2 py-1 bg-accent-primary text-surface-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
        {name} {role ? `(${role})` : ''}
      </span>
    </button>
  );
};

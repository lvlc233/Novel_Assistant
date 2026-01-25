
"use client";
import React, { useState } from 'react';
import { useMail, MailMessage, Agent } from '@/contexts/MailContext';
import { X, Filter, User, ChevronLeft } from 'lucide-react';
import BottomInput from '@/components/common/BottomInput'; // Reuse existing input

// Helper to format time
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Sub-components ---

const AgentSidebar: React.FC<{ 
  agents: Agent[], 
  currentFilter: string | 'all', 
  onSelect: (id: string | 'all') => void 
}> = ({ agents, currentFilter, onSelect }) => (
  <div className="w-[88px] h-full bg-surface-primary border-r border-border-primary flex flex-col items-center py-8 gap-4 shrink-0 shadow-[4px_0_24px_rgba(44,36,32,0.02)] z-10">
    <button
      onClick={() => onSelect('all')}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        currentFilter === 'all' 
          ? 'bg-accent-primary text-white shadow-lg scale-105 rotate-3' 
          : 'bg-surface-white text-text-secondary hover:bg-surface-hover hover:scale-105 border border-border-primary'
      }`}
      title="全部消息"
    >
      <Filter size={22} />
    </button>
    
    <div className="w-12 h-[1px] bg-border-primary/60 my-2" />
    
    {agents.map((agent, index) => (
      <button
        key={agent.id}
        onClick={() => onSelect(agent.id)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
          currentFilter === agent.id 
            ? 'ring-2 ring-accent-secondary ring-offset-2 ring-offset-surface-primary scale-105' 
            : 'hover:scale-105 opacity-90 hover:opacity-100 hover:rotate-2'
        }`}
        style={{ transitionDelay: `${index * 50}ms` }}
        title={agent.name}
      >
        {agent.avatar ? (
           <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-2xl object-cover shadow-sm border border-border-primary" />
        ) : (
           <div className={`w-full h-full rounded-2xl flex items-center justify-center text-surface-primary font-serif font-bold text-lg shadow-sm border border-white/20
             ${agent.id === 'system' ? 'bg-accent-primary' : 
               agent.id === 'frontend' ? 'bg-[#5D5C61]' :
               agent.id === 'writer' ? 'bg-accent-secondary' :
               'bg-[#8A817C]'
             }
           `}>
             {agent.name.substring(0, 1).toUpperCase()}
           </div>
        )}
        
        {/* Tooltip */}
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-accent-primary text-surface-primary text-xs font-serif tracking-wider rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
          {agent.name}
          {/* Arrow */}
          <span className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-accent-primary" />
        </span>
      </button>
    ))}
  </div>
);

const MessageList: React.FC<{
  messages: MailMessage[],
  agents: Agent[],
  onSelectMessage: (msg: MailMessage) => void,
  selectedId: string | null
}> = ({ messages, agents, onSelectMessage, selectedId }) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary/60 p-8 text-center bg-surface-primary">
        <div className="w-20 h-20 bg-surface-secondary rounded-[24px] flex items-center justify-center mb-6 text-accent-secondary border border-border-primary/50 shadow-inner">
            <MailMessageIcon size={32} />
        </div>
        <p className="text-base font-serif tracking-wide">暂无消息</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-primary">
      {messages.map((msg, index) => {
        const agent = agents.find(a => a.id === msg.senderId);
        const isSelected = selectedId === msg.id;
        const isSystem = msg.senderId === 'system';
        
        return (
          <div
            key={msg.id}
            onClick={() => onSelectMessage(msg)}
            className={`
              p-5 rounded-[20px] cursor-pointer transition-all duration-300 border group relative overflow-hidden
              ${isSelected 
                ? 'bg-surface-white border-accent-secondary/30 shadow-[0_8px_30px_rgba(44,36,32,0.08)] ring-1 ring-accent-secondary/20' 
                : 'bg-surface-white border-border-primary/60 hover:border-accent-secondary/20 hover:shadow-[0_4px_20px_rgba(44,36,32,0.04)] hover:-translate-y-0.5'}
              ${!msg.isRead && !isSelected ? 'border-l-[4px] border-l-accent-secondary pl-[17px]' : ''}
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Background decoration for system messages */}
            {isSystem && (
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-accent-secondary/5 rounded-full blur-2xl opacity-100 transition-transform group-hover:scale-150 duration-700" />
            )}

            <div className="flex justify-between items-start mb-2.5 relative z-10">
              <div className="flex items-center gap-3">
                 {/* Mini Avatar */}
                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-serif font-bold text-surface-primary shadow-sm
                    ${agent?.id === 'system' ? 'bg-accent-primary' : 'bg-text-secondary'}
                 `}>
                    {agent?.name.substring(0, 1).toUpperCase()}
                 </div>
                 <span className="font-serif font-bold text-sm text-text-primary tracking-wide">
                    {agent?.name || msg.senderId}
                 </span>
              </div>
              <span className="text-[11px] text-text-secondary/70 font-sans bg-surface-secondary px-2 py-1 rounded-full border border-border-primary/50">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            
            <p className={`text-sm leading-relaxed line-clamp-2 relative z-10 font-sans
              ${msg.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'}
            `}>
              {msg.content}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const MailMessageIcon = ({ size = 24, ...props }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);


// --- Main Drawer Component ---

export const MailboxDrawer: React.FC = () => {
  const { 
    isOpen, 
    closeMailbox, 
    messages, 
    agents, 
    currentFilter, 
    setFilter,
    markAsRead,
    sendMessage
  } = useMail();
  
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);

  // Filter messages
  const filteredMessages = currentFilter === 'all' 
    ? messages 
    : messages.filter(m => m.senderId === currentFilter);

  // Handle message selection
  const handleSelectMessage = (msg: MailMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      markAsRead(msg.id);
    }
  };

  // Handle reply
  const handleReply = (text: string) => {
    // If a message is selected, reply to that thread/context (simplified here)
    // If filtering by agent, send to that agent
    // Default to 'user' sending to 'system' or the context
    
    let targetAgentId = 'system';
    
    if (selectedMessage) {
        targetAgentId = selectedMessage.senderId;
    } else if (currentFilter !== 'all') {
        targetAgentId = currentFilter;
    }
    
    // In a real app, this would call an API. Here we just log locally.
    sendMessage('user', `(Reply to ${targetAgentId}) ${text}`, 'text');
    
    // Simulate AI reply for demo
    setTimeout(() => {
        sendMessage(targetAgentId, `收到您的回复: "${text}"。我会尽快处理。`, 'text');
    }, 1000);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
          onClick={closeMailbox}
        />
      )}

      {/* Drawer Panel - Slide from LEFT */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-[600px] 
          bg-surface-primary shadow-[20px_0_60px_rgba(44,36,32,0.1)] z-[100] 
          transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          flex
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Left Sidebar (Agents) */}
        <AgentSidebar 
          agents={agents} 
          currentFilter={currentFilter} 
          onSelect={(id) => {
            setFilter(id);
            setSelectedMessage(null); // Clear selection when changing filter
          }} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-surface-secondary/50 relative overflow-hidden">
          
          {/* Header */}
          <div className="h-20 px-8 border-b border-border-primary/60 flex items-center justify-between bg-surface-primary/80 backdrop-blur-md shrink-0 z-20">
            <div>
              <h2 className="text-2xl font-serif font-bold text-text-primary tracking-wide">
                {currentFilter === 'all' ? '全部信件' : agents.find(a => a.id === currentFilter)?.name}
              </h2>
              <p className="text-xs text-text-secondary mt-1 font-sans">
                {currentFilter === 'all' ? 'All Messages' : agents.find(a => a.id === currentFilter)?.role}
              </p>
            </div>
            <button 
              onClick={closeMailbox}
              className="p-2.5 hover:bg-surface-hover rounded-full transition-all duration-300 text-text-secondary hover:text-text-primary hover:rotate-90"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* List or Detail View */}
          
          <div className="flex-1 overflow-hidden flex flex-col relative">
             {selectedMessage ? (
               // Detail View
               <div className="absolute inset-0 bg-surface-primary flex flex-col z-10 animate-fade-in">
                  <div className="p-4 border-b border-border-primary/60 flex items-center gap-2 bg-surface-primary/80 backdrop-blur-md">
                    <button 
                        onClick={() => setSelectedMessage(null)}
                        className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <span className="font-serif font-medium text-text-primary">返回列表</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-surface-primary">
                    <div className="flex items-start gap-5 mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-white/20 shrink-0
                            ${agents.find(a => a.id === selectedMessage.senderId)?.id === 'system' ? 'bg-accent-primary' : 'bg-surface-white'}
                        `}>
                             {agents.find(a => a.id === selectedMessage.senderId)?.avatar ? (
                                <img src={agents.find(a => a.id === selectedMessage.senderId)?.avatar} className="w-full h-full rounded-2xl object-cover" />
                             ) : (
                                <User size={28} className={agents.find(a => a.id === selectedMessage.senderId)?.id === 'system' ? 'text-surface-primary' : 'text-text-secondary'} />
                             )}
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-1">
                                <div className="font-serif font-bold text-xl text-text-primary">
                                    {agents.find(a => a.id === selectedMessage.senderId)?.name}
                                </div>
                                <div className="text-sm text-text-secondary font-sans bg-surface-secondary px-3 py-1 rounded-full border border-border-primary">
                                    {formatTime(selectedMessage.timestamp)}
                                </div>
                            </div>
                            <div className="text-sm text-text-secondary font-sans">
                                {agents.find(a => a.id === selectedMessage.senderId)?.role || 'Assistant'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="prose prose-stone max-w-none">
                        <div className="p-8 bg-surface-white rounded-[24px] border border-border-primary shadow-sm text-text-primary text-base leading-relaxed font-sans whitespace-pre-wrap">
                            {selectedMessage.content}
                        </div>
                    </div>
                  </div>
               </div>
             ) : (
               // List View
               <MessageList 
                 messages={filteredMessages} 
                 agents={agents} 
                 onSelectMessage={handleSelectMessage}
                 selectedId={null}
               />
             )}
          </div>

          {/* Bottom Reply Area */}
          <div className="p-6 bg-surface-primary border-t border-border-primary/60 shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
             <div className="text-xs text-text-secondary mb-3 px-1 font-medium tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary"></span>
                {selectedMessage 
                    ? `回复 ${agents.find(a => a.id === selectedMessage.senderId)?.name}...` 
                    : currentFilter !== 'all' 
                        ? `发送任务给 ${agents.find(a => a.id === currentFilter)?.name}...` 
                        : '回复 (请先选择信件或联系人)...'
                }
             </div>
             {/* Use a simple textarea for now to avoid BottomInput's fixed positioning complexity here */}
             <BottomInput 
                position="static"
                placeholder="输入回复内容..."
                onSubmit={handleReply}
                className="w-full"
                disabled={!selectedMessage && currentFilter === 'all'}
             />
          </div>

        </div>
      </div>
    </>
  );
};

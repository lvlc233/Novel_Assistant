
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
  <div className="w-[72px] h-full bg-surface-secondary border-r border-border-primary flex flex-col items-center py-6 gap-3 shrink-0 z-10">
    <button
      onClick={() => onSelect('all')}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
        currentFilter === 'all' 
          ? 'bg-accent-primary text-surface-white shadow-md' 
          : 'bg-surface-white text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-primary'
      }`}
      title="全部消息"
    >
      <Filter size={18} />
    </button>
    
    <div className="w-8 h-[1px] bg-border-primary my-2" />
    
    {agents.map((agent) => (
      <button
        key={agent.id}
        onClick={() => onSelect(agent.id)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group ${
          currentFilter === agent.id 
            ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-surface-secondary' 
            : 'hover:scale-105 opacity-80 hover:opacity-100'
        }`}
        title={agent.name}
      >
        {agent.avatar ? (
           <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-xl object-cover shadow-sm" />
        ) : (
           <div className={`w-full h-full rounded-xl flex items-center justify-center text-surface-white font-bold text-sm shadow-sm
             ${agent.id === 'system' ? 'bg-accent-primary' : 'bg-gray-400'}
           `}>
             {agent.name.substring(0, 1).toUpperCase()}
           </div>
        )}
        
        {/* Tooltip */}
        <span className="absolute left-full ml-3 px-2 py-1 bg-accent-primary text-surface-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
          {agent.name}
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
        <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mb-4 text-text-secondary/40">
            <MailMessageIcon size={24} />
        </div>
        <p className="text-sm font-medium font-serif">暂无消息</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface-primary">
      {messages.map((msg) => {
        const agent = agents.find(a => a.id === msg.senderId);
        const isSelected = selectedId === msg.id;
        
        return (
          <div
            key={msg.id}
            onClick={() => onSelectMessage(msg)}
            className={`
              px-6 py-4 cursor-pointer transition-colors duration-200 border-b border-border-primary
              ${isSelected ? 'bg-surface-hover' : 'hover:bg-surface-secondary'}
              ${!msg.isRead ? 'bg-surface-white' : ''}
            `}
          >
            <div className="flex gap-4">
               {/* Avatar */}
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-surface-white shrink-0 shadow-sm
                  ${agent?.id === 'system' ? 'bg-accent-primary' : 'bg-gray-400'}
               `}>
                  {agent?.avatar ? (
                      <img src={agent.avatar} className="w-full h-full rounded-full object-cover" />
                  ) : (
                      agent?.name.substring(0, 1).toUpperCase()
                  )}
               </div>

               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                     <span className={`text-sm font-medium truncate pr-2 ${!msg.isRead ? 'text-text-primary font-bold' : 'text-text-primary/80'}`}>
                        {agent?.name || msg.senderId}
                     </span>
                     <span className="text-xs text-text-secondary whitespace-nowrap">
                        {formatTime(msg.timestamp)}
                     </span>
                  </div>
                  
                  <p className={`text-xs leading-relaxed line-clamp-2 ${!msg.isRead ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                    {msg.content}
                  </p>
               </div>
               
               {!msg.isRead && (
                 <div className="w-2 h-2 rounded-full bg-accent-secondary shrink-0 mt-2 ml-2" />
               )}
            </div>
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
    sendToAgent
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
  const handleReply = async (text: string) => {
    // If a message is selected, reply to that thread/context
    // If filtering by agent, send to that agent
    
    let targetAgentId = '';
    
    if (selectedMessage) {
        targetAgentId = selectedMessage.senderId;
    } else if (currentFilter !== 'all') {
        targetAgentId = currentFilter;
    }
    
    if (!targetAgentId || targetAgentId === 'system') {
        // System cannot be replied to
        return;
    }
    
    // Call the real API via context
    await sendToAgent(targetAgentId, text);
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
          fixed top-0 left-0 h-full w-[500px] 
          bg-surface-primary shadow-2xl z-[100] 
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
        <div className="flex-1 flex flex-col h-full bg-surface-primary relative overflow-hidden">
          
          {/* Header */}
          <div className="h-16 px-6 border-b border-border-primary flex items-center justify-between bg-surface-primary shrink-0 z-20">
            <div>
              <h2 className="text-lg font-bold font-serif text-text-primary tracking-tight">
                {currentFilter === 'all' ? '全部信件' : agents.find(a => a.id === currentFilter)?.name}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {currentFilter === 'all' ? 'All Messages' : agents.find(a => a.id === currentFilter)?.role}
              </p>
            </div>
            <button 
              onClick={closeMailbox}
              className="p-2 hover:bg-surface-hover rounded-full transition-all duration-200 text-text-secondary hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* List or Detail View */}
          
          <div className="flex-1 overflow-hidden flex flex-col relative">
             {selectedMessage ? (
               // Detail View
               <div className="absolute inset-0 bg-surface-primary flex flex-col z-10 animate-fade-in">
                  <div className="p-4 border-b border-border-primary flex items-center gap-2 bg-surface-primary">
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
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-surface-white/20 shrink-0
                            ${agents.find(a => a.id === selectedMessage.senderId)?.id === 'system' ? 'bg-accent-primary' : 'bg-surface-white'}
                        `}>
                             {agents.find(a => a.id === selectedMessage.senderId)?.avatar ? (
                                <img src={agents.find(a => a.id === selectedMessage.senderId)?.avatar} className="w-full h-full rounded-2xl object-cover" />
                             ) : (
                                <User size={28} className={agents.find(a => a.id === selectedMessage.senderId)?.id === 'system' ? 'text-surface-white' : 'text-text-secondary'} />
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
                        <div className="p-8 bg-surface-white rounded-2xl border border-border-primary text-text-primary text-base leading-relaxed font-sans whitespace-pre-wrap shadow-sm">
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
          <div className="p-6 bg-surface-primary border-t border-border-primary shrink-0 z-20">
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

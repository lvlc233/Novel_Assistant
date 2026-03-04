import React, { useState } from 'react';

// Types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  title: string;
  create_time: string;
  message_count: number;
  tokens: number;
  messages: Message[];
}

export interface PageData {
  id: string;
  name: string;
  sessions: Session[];
}

export interface ProjectSessionManagerProps {
  pages?: PageData[];
}

export const ProjectSessionManager: React.FC<ProjectSessionManagerProps> = ({ 
  pages = [] 
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>(pages[0]?.id || '');

  // Safety check
  if (!pages || pages.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-text-tertiary">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-square-off opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </div>
            <p>暂无项目会话记录</p>
        </div>
    );
  }

  const activePage = pages.find(p => p.id === activeTabId) || pages[0];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Custom Tabs Header */}
      <div className="px-6 pt-4 border-b border-border-primary bg-surface-white sticky top-0 z-10">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => setActiveTabId(page.id)}
                className={`pb-3 px-2 text-sm font-medium transition-all whitespace-nowrap relative ${
                    activeTabId === page.id 
                    ? 'text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {page.name}
                {activeTabId === page.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-t-full animate-scale-x" />
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary/10">
        <div className="grid grid-cols-1 gap-4">
          {activePage?.sessions?.map((session) => {
            const isExpanded = expandedSessionId === session.id;

            return (
              <div 
                key={session.id}
                className={`group relative bg-white border border-border-primary rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer ${isExpanded ? 'ring-2 ring-accent-primary/10' : ''}`}
                onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
              >
                {/* Left Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isExpanded ? 'bg-accent-primary' : 'bg-transparent group-hover:bg-accent-primary/50'}`} />

                {/* Main Content */}
                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-text-primary line-clamp-1 pr-2 text-sm">{session.title || '未命名会话'}</h4>
                    <span className="text-xs text-text-tertiary whitespace-nowrap font-mono">{session.create_time}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>{session.message_count}</span>
                    </div>
                    <div className="w-px h-3 bg-border-primary" />
                    <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M2 12l5-5m-5 5 5 5"/></svg>
                        <span>{session.tokens} T</span>
                    </div>
                  </div>
                </div>

                {/* Expanded History */}
                {isExpanded && (
                    <div 
                    className="border-t border-border-primary bg-surface-secondary/30 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                    >
                    <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {session.messages?.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-accent-primary text-white rounded-tr-sm' 
                            : 'bg-white border border-border-primary text-text-primary rounded-tl-sm shadow-sm'
                            }`}>
                            {msg.content}
                            </div>
                        </div>
                        ))}
                        {(!session.messages || session.messages.length === 0) && (
                        <div className="text-center text-xs text-text-tertiary py-4">无消息记录</div>
                        )}
                    </div>
                    </div>
                )}
              </div>
            );
          })}
          
          {(!activePage?.sessions || activePage.sessions.length === 0) && (
             <div className="py-12 flex flex-col items-center justify-center text-text-tertiary gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="opacity-20"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
               <span className="text-sm">该页面暂无会话</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

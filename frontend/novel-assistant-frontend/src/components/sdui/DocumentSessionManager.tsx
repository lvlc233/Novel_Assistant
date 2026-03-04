import React, { useState } from 'react';
import { Session } from './ProjectSessionManager';

// Reuse types from ProjectSessionManager
export type { Session, Message } from './ProjectSessionManager';

export interface DocumentData {
  id: string;
  title: string;
  sessions: Session[];
}

export interface DocumentSessionManagerProps {
  documents?: DocumentData[];
}

export const DocumentSessionManager: React.FC<DocumentSessionManagerProps> = ({ 
  documents = [] 
}) => {
  const [activeDocId, setActiveDocId] = useState<string>(documents[0]?.id || '');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  if (!documents || documents.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-text-tertiary">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-x opacity-50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9.5" x2="14.5" y1="12.5" y2="12.5"/><line x1="12" x2="12" y1="10" y2="15"/></svg>
            </div>
            <p>暂无文档会话记录</p>
        </div>
    );
  }

  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  return (
    <div className="h-full flex bg-surface-secondary/10">
      {/* Left Sidebar: Document List */}
      <div className="w-1/3 min-w-[200px] max-w-[300px] border-r border-border-primary bg-white flex flex-col">
        <div className="p-4 border-b border-border-primary">
            <h3 className="font-bold text-text-primary text-sm">文档列表</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {documents.map(doc => (
                <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        activeDocId === doc.id 
                        ? 'bg-accent-primary/10 text-accent-primary font-medium' 
                        : 'text-text-secondary hover:bg-surface-secondary'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="truncate">{doc.title}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Right Content: Session List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
            <h2 className="text-lg font-bold text-text-primary">{activeDoc?.title}</h2>
            <p className="text-xs text-text-tertiary">共 {activeDoc?.sessions?.length || 0} 个会话</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeDoc?.sessions?.map((session) => {
            const isExpanded = expandedSessionId === session.id;

            return (
              <div 
                key={session.id}
                className={`group relative bg-white border border-border-primary rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer ${isExpanded ? 'ring-2 ring-accent-primary/10' : ''}`}
                onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
              >
                 {/* Reuse similar card structure from ProjectSessionManager */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isExpanded ? 'bg-accent-primary' : 'bg-transparent group-hover:bg-accent-primary/50'}`} />

                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-text-primary line-clamp-1 pr-2 text-sm">{session.title || '未命名会话'}</h4>
                    <span className="text-xs text-text-tertiary whitespace-nowrap font-mono">{session.create_time}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>{session.message_count}</span>
                    </div>
                    <div className="w-px h-3 bg-border-primary" />
                    <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M2 12l5-5m-5 5 5 5"/></svg>
                        <span>{session.tokens} T</span>
                    </div>
                  </div>
                </div>

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
          
          {(!activeDoc?.sessions || activeDoc.sessions.length === 0) && (
             <div className="py-12 flex flex-col items-center justify-center text-text-tertiary gap-2">
               <span className="text-sm">暂无会话</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

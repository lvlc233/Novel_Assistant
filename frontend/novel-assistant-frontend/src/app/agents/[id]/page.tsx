"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Wifi,
  MoreVertical,
  StopCircle
} from 'lucide-react';
import { agentService } from '@/services/agentService';
import { AgentDetail, AgentMessage } from '@/types/agent';
import { SlotInjector } from '@/components/common/SlotInjector';
import { AppLayout } from '@/components/layout/AppLayout';
import ReactMarkdown from 'react-markdown';

export default function AgentChatPage() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopStreamRef = useRef<() => void>(() => {});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      try {
        const agentData = await agentService.getAgentDetail(id);
        setAgent(agentData);
        
        // Create a new session for now (in real app, might list sessions first)
        const session = await agentService.createSession(id);
        setSessionId(session);
      } catch (error) {
        console.error('Failed to init agent chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
        init();
    }
  }, [id]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming || !agent) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Placeholder for assistant message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }]);

    const stop = agentService.chatStream(
      agent.agent_id,
      sessionId,
      { messages_type: 'text', context: userMessage.content },
      (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content += chunk;
          }
          return newMessages;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        console.error('Stream error:', err);
        setIsStreaming(false);
        setMessages(prev => [...prev, {
            role: 'system',
            content: 'Error: Failed to receive response.',
            timestamp: new Date().toISOString()
        }]);
      }
    );

    stopStreamRef.current = stop;
  };

  const handleStop = () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      setIsStreaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Bot className="w-16 h-16 text-text-tertiary" />
        <h2 className="text-xl font-bold text-text-primary">Agent Not Found</h2>
        <Link href="/agents" className="px-4 py-2 bg-accent-primary text-white rounded-lg">
          Return to Agents
        </Link>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-surface-secondary">
       <SlotInjector slotId="header-breadcrumb">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/home" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <Link href="/agents" className="hover:text-text-primary">Agents</Link>
            <span>/</span>
            <span className="text-text-primary">{agent.agent_name}</span>
          </div>
      </SlotInjector>

      {/* Header */}
      <div className="h-16 px-6 bg-surface-primary border-b border-border-primary flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/agents" 
            className="p-2 hover:bg-surface-hover rounded-lg text-text-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                 <Bot className="w-5 h-5" />
             </div>
             <div>
                <h1 className="font-bold text-text-primary flex items-center gap-2">
                    {agent.agent_name}
                    {agent.broadcast && (
                        <Wifi className="w-3 h-3 text-green-500" />
                    )}
                </h1>
                <p className="text-xs text-text-tertiary">
                    {isStreaming ? 'Typing...' : agent.enable ? 'Online' : 'Offline'}
                </p>
             </div>
          </div>
        </div>

        <button className="p-2 hover:bg-surface-hover rounded-lg text-text-secondary">
            <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-text-tertiary space-y-4 opacity-50">
                 <Bot className="w-16 h-16" />
                 <p>Start a conversation with {agent.agent_name}</p>
             </div>
        ) : (
            messages.map((msg, idx) => (
                <div 
                    key={idx} 
                    className={`flex gap-4 max-w-4xl mx-auto ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' 
                            ? 'bg-accent-primary text-white' 
                            : 'bg-surface-primary border border-border-primary text-accent-primary'
                    }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                            msg.role === 'user'
                                ? 'bg-accent-primary text-white rounded-tr-none'
                                : 'bg-surface-primary border border-border-primary text-text-primary rounded-tl-none'
                        }`}>
                             {msg.role === 'user' ? (
                                 <p className="whitespace-pre-wrap">{msg.content}</p>
                             ) : (
                                 <div className="prose prose-sm dark:prose-invert max-w-none">
                                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                                 </div>
                             )}
                        </div>
                        {msg.timestamp && (
                            <span className="text-[10px] text-text-tertiary mt-1 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface-primary border-t border-border-primary shrink-0">
         <div className="max-w-4xl mx-auto relative">
             <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-surface-secondary border border-border-primary rounded-xl p-2 focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary transition-all">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={`Message ${agent.agent_name}...`}
                    className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3 bg-transparent border-none focus:ring-0 resize-none text-text-primary placeholder:text-text-tertiary"
                    rows={1}
                />
                <div className="flex items-center gap-2 pb-1 pr-1">
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={handleStop}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="Stop generating"
                        >
                            <StopCircle className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="p-2 bg-accent-primary hover:bg-accent-hover disabled:bg-surface-hover disabled:text-text-disabled text-white rounded-lg transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
             </form>
             <div className="text-center mt-2">
                 <p className="text-xs text-text-tertiary">
                     AI can make mistakes. Please verify important information.
                 </p>
             </div>
         </div>
      </div>
      </div>
    </AppLayout>
  );
}

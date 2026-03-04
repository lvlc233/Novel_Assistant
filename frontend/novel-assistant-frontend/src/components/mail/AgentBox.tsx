import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot } from 'lucide-react';
import { invokePluginOperation } from '@/services/pluginService';
import { logger } from '@/lib/logger';

interface Message {
    type: string;
    content: string;
}

interface AgentBoxProps {
    agent_name: string;
    session_id: string;
    messages: Message[];
    on_email?: boolean;
}

export const AgentBox: React.FC<AgentBoxProps> = ({ 
    agent_name, 
    session_id, 
    messages: initialMessages,
    on_email 
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { type: 'human', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Invoke proxy_send_agent_message
            // The backend expects params: agent_name, message, session_id
            const params = {
                agent_name: agent_name,
                message: userMsg.content,
                session_id: session_id
            };

            const response = await invokePluginOperation(
                'agent_manager', 
                'proxy_send_agent_message',
                params
            );
            
            // Handle response
            if (response) {
                if (typeof response === 'string') {
                    setMessages(prev => [...prev, { type: 'ai', content: response }]);
                } else if (typeof response === 'object') {
                    const content = (response as any).content || (response as any).message || JSON.stringify(response);
                    setMessages(prev => [...prev, { type: 'ai', content: content }]);
                }
            }

        } catch (error) {
            logger.error('AgentBox send error:', error);
            setMessages(prev => [...prev, { type: 'error', content: '发送失败，请重试' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] w-[350px] bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden pointer-events-auto">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                <div className="font-medium text-stone-800 flex items-center gap-2">
                    <Bot size={16} />
                    {agent_name}
                </div>
                <div className={`w-2 h-2 rounded-full ${on_email ? 'bg-green-500' : 'bg-gray-300'}`} title={on_email ? "邮件通知已开启" : "邮件通知已关闭"} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'human' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                            msg.type === 'human' 
                                ? 'bg-stone-800 text-white rounded-tr-sm' 
                                : msg.type === 'error'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-white text-stone-800 rounded-tl-sm border border-stone-100'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-stone-100 text-stone-400 text-sm animate-pulse shadow-sm">
                            ...
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-stone-100 bg-white flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="发送消息..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-stone-900 text-white rounded-full hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

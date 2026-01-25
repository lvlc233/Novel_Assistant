import React, { useState } from 'react';
import { Settings, Plus, Send, MoreHorizontal, User, Bot, Search, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
    isExpanded: boolean;
    onToggle: () => void;
}

export default function AIAssistant({ isExpanded, onToggle }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的小说助手。有什么我可以帮你的吗？比如帮你构思大纲，或者检查逻辑漏洞。' },
    { id: '2', role: 'user', content: '我想写一个关于赛博朋克背景的故事。' },
    { id: '3', role: 'assistant', content: '听起来很棒！我们可以从世界观设定开始。你希望是高科技低生活（High Tech, Low Life）的经典设定，还是有独特的变体？' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), role: 'user', content: input }]);
    setInput('');
    // Mock response
    setTimeout(() => {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '这是一个很好的切入点...' }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm relative z-20">
      {/* Header */}
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                <Settings size={16} />
            </div>
            <span className="font-serif font-bold text-gray-800">小说助手</span>
        </div>
        <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <MoreHorizontal size={20} className="text-gray-500" />
            </button>
            <button 
                onClick={onToggle}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="收起助手"
            >
                <ChevronLeft size={20} className="text-gray-500" />
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`
                w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border
                ${msg.role === 'user' ? 'bg-gray-100 border-gray-200' : 'bg-black text-white border-black'}
            `}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} />}
            </div>
            
            {/* Bubble */}
            <div className={`
                max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm border
                ${msg.role === 'user' 
                    ? 'bg-white border-gray-100 text-gray-800 rounded-tr-sm' 
                    : 'bg-gray-50 border-gray-100 text-gray-700 rounded-tl-sm'}
            `}>
                {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
        {['生成大纲', '润色段落', '检查逻辑'].map((action) => (
            <button 
                key={action}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
                {action}
            </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black/20 transition-all shadow-sm">
            <button className="p-2 text-gray-400 hover:text-black transition-colors">
                <Plus size={20} />
            </button>
            <input 
                type="text" 
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-sans"
                placeholder="输入指令..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
             <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
            <button 
                onClick={handleSend}
                className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
            >
                <Send size={16} />
            </button>
        </div>
      </div>
      
      {/* Side Widget Placeholder (as per sketch) */}
      <div className="absolute -left-12 top-20 w-10 h-32 bg-white border border-gray-200 rounded-l-xl shadow-sm flex flex-col items-center py-4 gap-4 z-10 hidden xl:flex">
          {/* Mock Widget Icons */}
          <div className="w-6 h-6 rounded bg-gray-100"></div>
          <div className="w-6 h-6 rounded bg-gray-100"></div>
          <div className="w-6 h-6 rounded bg-gray-100"></div>
      </div>
    </div>
  );
}

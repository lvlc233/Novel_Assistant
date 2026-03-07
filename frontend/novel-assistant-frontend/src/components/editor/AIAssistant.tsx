import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings, Plus, Send, MoreHorizontal, User, Bot, ChevronLeft, StopCircle } from 'lucide-react';
import { agentService } from '@/services/agentService';
import { invokePluginOperation, getPluginsFromShop } from '@/services/pluginService';
import { config } from '@/config';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AgentHistoryItem {
  session_id: string;
  messages?: Array<{ type?: string; content?: string }>;
}

interface AgentInfo {
    id: string; // or agent_id
    name: string;
    description?: string;
    history?: AgentHistoryItem[];
    current_session_id?: string;
}

interface AIAssistantProps {
  isExpanded: boolean;
  onToggle: () => void;
  documentId?: string | null;
  workId?: string | null;
}

export default function AIAssistant({ isExpanded, onToggle, documentId, workId }: AIAssistantProps) {
  const initialWelcome: Message = { id: '1', role: 'assistant', content: '你好！我是你的小说助手。请选择一个 Agent 开始对话。' };
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    initialWelcome,
  ]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [agentManagerId, setAgentManagerId] = useState<string>('');
  const [sessionsByAgent, setSessionsByAgent] = useState<Record<string, string[]>>({});
  const [currentSessionByAgent, setCurrentSessionByAgent] = useState<Record<string, string>>({});
  const [messagesByAgentSession, setMessagesByAgentSession] = useState<Record<string, Message[]>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopStreamRef = useRef<() => void>(() => {});
  const currentAgentRef = useRef<string>('');
  const currentSessionRef = useRef<string>('');

  const makeAgentSessionKey = (agentName: string, sid: string) => `${agentName}::${sid}`;

  useEffect(() => {
      // Init Session ID
      setSessionId(`session-${Date.now()}`);

      // Load Agents
      const loadAgents = async () => {
          try {
              // 1. Find Agent Manager Plugin ID
              let plugins = await getPluginsFromShop();
              console.log("[AIAssistant] All plugins (cached):", plugins.map(p => ({ id: p.id, name: p.name })));

              // Try finding by name (Chinese or English key)
              let amPlugin = plugins.find(p => p.name === 'Agent管理器' || p.name === 'agent_manager');
              
              if (!amPlugin) {
                  console.warn("[AIAssistant] Agent Manager not found in cache, forcing refresh...");
                  plugins = await getPluginsFromShop(true); // Force refresh
                  console.log("[AIAssistant] All plugins (refreshed):", plugins.map(p => ({ id: p.id, name: p.name })));
                  amPlugin = plugins.find(p => p.name === 'Agent管理器' || p.name === 'agent_manager');
              }

              console.log("[AIAssistant] Found Agent Manager Plugin:", amPlugin);
              
              let loadedAgents: AgentInfo[] = [];
              
              if (amPlugin) {
                  setAgentManagerId(amPlugin.id);
                  // 2. Invoke operation with correct UUID
                  const res = await invokePluginOperation(amPlugin.id, 'get_agent_info_in_card', {});
                  console.log("[AIAssistant] Raw response from get_agent_info_in_card:", res);
                  
                  // Backend returns { plugin_id, operation, payload: { data: { agents: [] } } }
                  // or sometimes just the payload if the service unwraps it differently.
                  // Let's try to handle both.
                  const payload = res?.payload || res;
                  const agentsList = payload?.data?.agents || payload?.agents;
                  console.log("[AIAssistant] Parsed agentsList:", agentsList);

                  if (agentsList) {
                      loadedAgents = agentsList.map((a: any) => ({
                          id: a.id || a.agent_id || a.agent_name || a.name, // Fallback to agent_name if id/name missing
                          name: a.name || a.agent_name,
                          description: a.description || a.agent_description,
                          history: Array.isArray(a.history) ? a.history : [],
                          current_session_id: a.current_session_id
                      }));
                  }
              } else {
                  console.warn("[AIAssistant] Agent Manager plugin not found in shop list");
              }

              if (loadedAgents.length === 0) {
                   // Fallback to mock/service if plugin returns nothing
                   const serviceAgents = await agentService.getAgents();
                   loadedAgents = serviceAgents.map(a => ({
                       id: a.agent_id,
                       name: a.agent_name,
                       description: a.agent_description
                   }));
              }

              setAgents(loadedAgents);
              if (loadedAgents.length > 0) {
                  setSelectedAgent(loadedAgents[0]);
                  const now = Date.now();
                  const nextSessionsByAgent: Record<string, string[]> = {};
                  const nextCurrentSessionByAgent: Record<string, string> = {};
                  const nextMessagesByAgentSession: Record<string, Message[]> = {};

                  loadedAgents.forEach((agent, idx) => {
                      const agentName = agent.name;
                      const history = agent.history || [];
                      const sessionIds = history.map(h => h.session_id).filter(Boolean);
                      const fallbackSession = `session-${now}-${idx}`;
                      const currentSession = agent.current_session_id || sessionIds[sessionIds.length - 1] || fallbackSession;
                      const mergedSessions = sessionIds.includes(currentSession) ? sessionIds : [...sessionIds, currentSession];

                      nextSessionsByAgent[agentName] = mergedSessions;
                      nextCurrentSessionByAgent[agentName] = currentSession;

                      history.forEach(h => {
                          const sid = h.session_id;
                          if (!sid) return;
                          const mappedMessages = (h.messages || []).map((m, i) => ({
                              id: `${sid}-${i}-${Date.now()}`,
                              role: String(m?.type || '').toLowerCase().includes('human') || String(m?.type || '').toLowerCase().includes('user') ? 'user' as const : 'assistant' as const,
                              content: m?.content || ''
                          }));
                          nextMessagesByAgentSession[makeAgentSessionKey(agentName, sid)] = mappedMessages.length > 0 ? mappedMessages : [initialWelcome];
                      });

                      const currentKey = makeAgentSessionKey(agentName, currentSession);
                      if (!nextMessagesByAgentSession[currentKey]) {
                          nextMessagesByAgentSession[currentKey] = [initialWelcome];
                      }
                  });

                  setSessionsByAgent(nextSessionsByAgent);
                  setCurrentSessionByAgent(nextCurrentSessionByAgent);
                  setMessagesByAgentSession(nextMessagesByAgentSession);
              }
          } catch (e) {
              console.error("Failed to load agents:", e);
              setMessages(prev => [...prev, { id: 'err', role: 'system', content: '加载 Agent 列表失败。请尝试刷新页面。' }]);
          }
      };
      loadAgents();
  }, []);

  useEffect(() => {
      if (!selectedAgent) return;
      const agentName = selectedAgent.name;
      const selectedSession = currentSessionByAgent[agentName];
      if (!selectedSession) return;
      const key = makeAgentSessionKey(agentName, selectedSession);
      const nextMessages = messagesByAgentSession[key] || [initialWelcome];
      currentAgentRef.current = agentName;
      currentSessionRef.current = selectedSession;
      setSessionId(selectedSession);
      setMessages(nextMessages);
  }, [selectedAgent, currentSessionByAgent, messagesByAgentSession]);

  useEffect(() => {
      const agentName = currentAgentRef.current;
      const sid = currentSessionRef.current;
      if (!agentName || !sid) return;
      const key = makeAgentSessionKey(agentName, sid);
      setMessagesByAgentSession(prev => ({ ...prev, [key]: messages }));
  }, [messages]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSwitchSession = async (nextSessionId: string) => {
      if (!selectedAgent) return;
      const agentName = selectedAgent.name;
      if (agentManagerId) {
          try {
              await invokePluginOperation(agentManagerId, 'switch_agent_session', {
                  agent_name: agentName,
                  session_id: nextSessionId
              });
          } catch (e) {
              console.error('Failed to switch session on backend:', e);
          }
      }
      setCurrentSessionByAgent(prev => ({ ...prev, [agentName]: nextSessionId }));
      setSessionId(nextSessionId);
  };

  const handleCreateSession = async () => {
      if (!selectedAgent) return;
      const agentName = selectedAgent.name;
      let newSessionId = `session-${Date.now()}`;
      if (agentManagerId) {
          try {
              const res = await invokePluginOperation(agentManagerId, 'create_agent_session', { agent_name: agentName });
              const payload = res?.payload || res;
              if (payload?.session_id) {
                  newSessionId = payload.session_id;
              }
          } catch (e) {
              console.error('Failed to create session on backend:', e);
          }
      }
      setSessionsByAgent(prev => {
          const existing = prev[agentName] || [];
          return existing.includes(newSessionId)
              ? prev
              : { ...prev, [agentName]: [...existing, newSessionId] };
      });
      setMessagesByAgentSession(prev => ({
          ...prev,
          [makeAgentSessionKey(agentName, newSessionId)]: [initialWelcome]
      }));
      setCurrentSessionByAgent(prev => ({ ...prev, [agentName]: newSessionId }));
      setSessionId(newSessionId);
      setMessages([initialWelcome]);
  };

  const handleSend = () => {
    if (!input.trim() || !selectedAgent) return;
    
    const activeAgentName = selectedAgent.name;
    const activeSessionId = sessionId || `session-${Date.now()}`;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    if (!sessionId) {
        setSessionId(activeSessionId);
        setCurrentSessionByAgent(prev => ({ ...prev, [activeAgentName]: activeSessionId }));
        setSessionsByAgent(prev => {
            const existing = prev[activeAgentName] || [];
            return existing.includes(activeSessionId)
                ? prev
                : { ...prev, [activeAgentName]: [...existing, activeSessionId] };
        });
    }

    // Placeholder for assistant
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    // Use Plugin Proxy for streaming if we have the plugin ID
    if (agentManagerId) {
        // Construct URL with API prefix manually since we are using raw fetch for streaming
        const baseUrl = config.work.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
        const url = `${baseUrl}/api/v1/plugin/proxy/${agentManagerId}/proxy_send_agent_message`;
        const controller = new AbortController();
        
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                params: {
                    agent_name: selectedAgent.name,
                    message: input,
                    session_id: activeSessionId
                }
            }),
            signal: controller.signal
        }).then(async (response) => {
            if (!response.ok) {
                const raw = await response.text();
                throw new Error(`HTTP ${response.status}: ${raw || response.statusText}`);
            }
            
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Response body is null');
            
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // NDJSON parsing
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; 
                
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        // Backend proxy_send_agent_message returns whatever the agent returns.
                        // LangGraph typically returns events. 
                        // Assuming the agent returns chunks of text or event dicts.
                        // Let's assume it returns { content: "..." } or just string if the generator yields strings.
                        // But wait, the backend generator_wrapper dumps dicts as JSON.
                        
                        // Based on proxy_send_agent_message in backend, it calls agent.astream.
                        // agent.astream yields events.
                        // We need to inspect what the backend actually yields.
                        // For now, let's append data.content or data if string.
                        
                        if (data?.status === 'error') {
                            const errorText = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMsgId
                                    ? { ...msg, content: `后端报错：${errorText}` }
                                    : msg
                            ));
                            setIsStreaming(false);
                            controller.abort();
                            return;
                        }

                        let content = '';
                        if (typeof data === 'string') {
                            content = data;
                        } else if (data?.content) {
                            content = data.content;
                        } else if (data?.messages && Array.isArray(data.messages)) {
                             // LangGraph state update?
                             const lastMsg = data.messages[data.messages.length - 1];
                             if (lastMsg?.content) content = lastMsg.content;
                        } else if (data?.output) {
                             content = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
                        }
                        
                        // Accumulate or replace?
                        // If streaming tokens, we accumulate.
                        // But LangGraph astream might return full state updates.
                        // If the backend wraps it, we need to be careful.
                        // Let's assume for now it's simple accumulation if possible, or we might see duplicate text.
                        // Actually, let's just dump the raw content for debugging if format is unknown, 
                        // but better to try to be smart.
                        
                        // If it is a token stream, we append.
                        // If it is state snapshots, we might need to replace.
                        // Given we are using a general proxy, let's assume we append whatever string we find.
                        if (content) {
                             setMessages(prev => prev.map(msg => 
                                msg.id === assistantMsgId 
                                    ? { ...msg, content: msg.content + content } // Append
                                    : msg
                            ));
                        }
                    } catch (e) {
                        console.error("Error parsing NDJSON line", e);
                    }
                }
            }

            if (buffer.trim()) {
                try {
                    const data = JSON.parse(buffer.trim());
                    if (data?.status === 'error') {
                        const errorText = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
                        setMessages(prev => prev.map(msg =>
                            msg.id === assistantMsgId
                                ? { ...msg, content: `后端报错：${errorText}` }
                                : msg
                        ));
                    }
                } catch (e) {
                    console.error("Error parsing final NDJSON buffer", e);
                }
            }
            setIsStreaming(false);
        }).catch(err => {
            if (err.name === 'AbortError') return;
            console.error('Chat error:', err);
            setIsStreaming(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '对话出错: ' + String(err) }]);
        });

        stopStreamRef.current = () => controller.abort();
        return;
    }

    // Fallback to old agentService if plugin ID not found (e.g. mock mode)
    const stop = agentService.chatStream(
        selectedAgent.id, // Ensure this ID is correct for backend routing
        activeSessionId,
        { 
            messages_type: 'text', 
            context: input,
            // Pass extra context if needed by plugins
            extra: {
                work_id: workId,
                document_id: documentId
            }
        },
        (chunk) => {
            setMessages(prev => prev.map(msg => 
                msg.id === assistantMsgId 
                    ? { ...msg, content: msg.content + chunk }
                    : msg
            ));
        },
        () => {
            setIsStreaming(false);
        },
        (err) => {
            console.error('Chat error:', err);
            setIsStreaming(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '对话出错: ' + String(err) }]);
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

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm relative z-20">
      {/* Header */}
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden flex-1 max-w-[calc(100%-80px)]">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                <Settings size={16} />
            </div>
            
            {/* Agent Selector */}
            {agents.length > 0 ? (
                <div className="relative group flex-1">
                    <select 
                        className="appearance-none bg-transparent font-serif font-bold text-gray-800 outline-none text-sm cursor-pointer hover:text-black py-1 pr-4 pl-1 rounded transition-colors w-full truncate"
                        value={selectedAgent?.id || ''}
                        onChange={(e) => {
                            const agent = agents.find(a => a.id === e.target.value);
                            if (agent) setSelectedAgent(agent);
                        }}
                    >
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <ChevronLeft size={14} className="-rotate-90" />
                    </div>
                </div>
            ) : (
                <span className="font-serif font-bold text-gray-800 truncate">小说助手(未连接)</span>
            )}
            {selectedAgent && (
                <div className="flex items-center gap-1 ml-1">
                    <div className="relative">
                        <select
                            className="appearance-none bg-white border border-gray-200 text-[11px] rounded px-2 py-1 pr-5 text-gray-600 max-w-[120px] truncate"
                            value={currentSessionByAgent[selectedAgent.name] || ''}
                            onChange={(e) => handleSwitchSession(e.target.value)}
                        >
                            {(sessionsByAgent[selectedAgent.name] || []).map(sid => (
                                <option key={sid} value={sid}>{sid}</option>
                            ))}
                        </select>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronLeft size={12} className="-rotate-90" />
                        </div>
                    </div>
                    <button
                        onClick={handleCreateSession}
                        className="p-1 rounded border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300"
                        title="新建会话"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
                max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm border overflow-hidden
                ${msg.role === 'user' 
                    ? 'bg-white border-gray-100 text-gray-800 rounded-tr-sm' 
                    : 'bg-gray-50 border-gray-100 text-gray-700 rounded-tl-sm'}
                ${msg.role === 'system' ? 'bg-red-50 text-red-600 border-red-100 w-full max-w-full text-center' : ''}
            `}>
                {msg.role === 'user' ? (
                   <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                   <div className="prose prose-sm max-w-none prose-p:my-0">
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                   </div>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        {['生成大纲', '润色段落', '检查逻辑'].map((action) => (
            <button 
                key={action}
                onClick={() => setInput(action)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
                {action}
            </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0">
        <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black/20 transition-all shadow-sm">
            <button className="p-2 text-gray-400 hover:text-black transition-colors">
                <Plus size={20} />
            </button>
            <input 
                type="text" 
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-sans"
                placeholder={selectedAgent ? `发送给 ${selectedAgent.name}...` : (agents.length === 0 ? "加载 Agent 列表..." : "请选择一个 Agent...")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    // Prevent default to avoid line break if we were in textarea, but this is input.
                    // Just ensure we don't trigger if IME is composing if possible, but standard input doesn't usually.
                    if (e.key === 'Enter' && !isStreaming) {
                         e.preventDefault();
                         handleSend();
                    }
                }}
                disabled={isStreaming}
            />
             <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
            
            {isStreaming ? (
                <button 
                    onClick={handleStop}
                    className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md active:scale-95"
                >
                    <StopCircle size={16} />
                </button>
            ) : (
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || !selectedAgent || isStreaming}
                    className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={16} />
                </button>
            )}
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

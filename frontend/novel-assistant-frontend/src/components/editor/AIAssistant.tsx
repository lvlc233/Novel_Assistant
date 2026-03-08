import React, { useState, useEffect, useRef, useReducer } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings, Plus, Send, MoreHorizontal, User, Bot, ChevronLeft, StopCircle, Trash2 } from 'lucide-react';
import { agentService } from '@/services/agentService';
import { invokePluginOperation, getPluginsFromShop } from '@/services/pluginService';
import { config } from '@/config';
import ToolDispatchCard from './ToolDispatchCard';
import HumanInTheLoopCard from './HumanInTheLoopCard';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamArtifact {
  id: string;
  type: 'tool_dispatch' | 'tool_result' | 'hitl_interrupt';
  toolName?: string;
  message?: string;
  args?: unknown;
  content?: string;
  status?: 'pending' | 'approved' | 'edited' | 'rejected';
  actionName?: string;
}

interface MessageSegmentText {
  id: string;
  type: 'text';
  content: string;
}

interface MessageSegmentArtifact {
  id: string;
  type: 'artifact';
  artifactId: string;
}

type MessageSegment = MessageSegmentText | MessageSegmentArtifact;

interface HitlPendingState {
  messageId: string;
  artifactId: string;
  status: 'pending' | 'resolving';
}

interface DocumentHelperContextPayload {
  version_id?: string | null;
  document_content?: string;
  document_title?: string;
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

interface NormalizedAgentEvent {
  type: 'assistant_chunk' | 'tool_dispatch' | 'tool_result' | 'hitl_interrupt' | 'error' | 'other';
  content?: string;
  toolName?: string;
  args?: unknown;
  message?: string;
  payload?: unknown;
  errorMessage?: string;
}

interface AgentSessionStore {
  sessionsByAgent: Record<string, string[]>;
  currentSessionByAgent: Record<string, string>;
  messagesByAgentSession: Record<string, Message[]>;
}

type AgentSessionAction =
  | {
      type: 'replace_all';
      payload: AgentSessionStore;
    }
  | {
      type: 'hydrate_agent_snapshot';
      payload: {
        agentName: string;
        sessions: string[];
        currentSession?: string;
        messagesBySession: Record<string, Message[]>;
      };
    }
  | {
      type: 'set_current_session';
      payload: { agentName: string; sessionId: string };
    }
  | {
      type: 'upsert_session';
      payload: { agentName: string; sessionId: string; messages?: Message[] };
    }
  | {
      type: 'delete_session';
      payload: { agentName: string; sessionId: string; fallbackSessionId: string };
    }
  | {
      type: 'set_messages_for_session';
      payload: { agentName: string; sessionId: string; messages: Message[] };
    };

const INITIAL_AGENT_SESSION_STORE: AgentSessionStore = {
  sessionsByAgent: {},
  currentSessionByAgent: {},
  messagesByAgentSession: {},
};

function reduceAgentSessionStore(state: AgentSessionStore, action: AgentSessionAction): AgentSessionStore {
  if (action.type === 'replace_all') {
    return action.payload;
  }
  if (action.type === 'hydrate_agent_snapshot') {
    const { agentName, sessions, currentSession, messagesBySession } = action.payload;
    return {
      sessionsByAgent: { ...state.sessionsByAgent, [agentName]: sessions },
      currentSessionByAgent: currentSession
        ? { ...state.currentSessionByAgent, [agentName]: currentSession }
        : state.currentSessionByAgent,
      messagesByAgentSession: { ...state.messagesByAgentSession, ...messagesBySession },
    };
  }
  if (action.type === 'set_current_session') {
    return {
      ...state,
      currentSessionByAgent: {
        ...state.currentSessionByAgent,
        [action.payload.agentName]: action.payload.sessionId,
      },
    };
  }
  if (action.type === 'upsert_session') {
    const { agentName, sessionId, messages } = action.payload;
    const existing = state.sessionsByAgent[agentName] || [];
    const nextSessions = existing.includes(sessionId) ? existing : [...existing, sessionId];
    const nextMessages = messages
      ? { ...state.messagesByAgentSession, [`${agentName}::${sessionId}`]: messages }
      : state.messagesByAgentSession;
    return {
      ...state,
      sessionsByAgent: { ...state.sessionsByAgent, [agentName]: nextSessions },
      messagesByAgentSession: nextMessages,
    };
  }
  if (action.type === 'delete_session') {
    const { agentName, sessionId, fallbackSessionId } = action.payload;
    const nextSessions = (state.sessionsByAgent[agentName] || []).filter((item) => item !== sessionId);
    const nextMessages = { ...state.messagesByAgentSession };
    delete nextMessages[`${agentName}::${sessionId}`];
    return {
      sessionsByAgent: { ...state.sessionsByAgent, [agentName]: nextSessions },
      currentSessionByAgent: { ...state.currentSessionByAgent, [agentName]: fallbackSessionId },
      messagesByAgentSession: nextMessages,
    };
  }
  const { agentName, sessionId, messages } = action.payload;
  return {
    ...state,
    messagesByAgentSession: {
      ...state.messagesByAgentSession,
      [`${agentName}::${sessionId}`]: messages,
    },
  };
}

interface AIAssistantProps {
  isExpanded: boolean;
  onToggle: () => void;
  documentId?: string | null;
  workId?: string | null;
}

const INITIAL_WELCOME_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: '你好！我是你的小说助手。请选择一个 Agent 开始对话。'
};
const INITIAL_WELCOME_MESSAGES: Message[] = [INITIAL_WELCOME_MESSAGE];

export default function AIAssistant({ isExpanded, onToggle, documentId, workId }: AIAssistantProps) {
  const areMessagesEqual = (left: Message[] | undefined, right: Message[] | undefined) => {
      if (!left || !right) return !left && !right;
      if (left.length !== right.length) return false;
      return left.every((m, i) => {
          const n = right[i];
          return m.id === n.id && m.role === n.role && m.content === n.content;
      });
  };
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_WELCOME_MESSAGES);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [agentManagerId, setAgentManagerId] = useState<string>('');
  const [agentSessionStore, dispatchAgentSession] = useReducer(reduceAgentSessionStore, INITIAL_AGENT_SESSION_STORE);
  const [artifactsByMessageId, setArtifactsByMessageId] = useState<Record<string, StreamArtifact[]>>({});
  const [segmentsByMessageId, setSegmentsByMessageId] = useState<Record<string, MessageSegment[]>>({});
  const [pendingHitlBySession, setPendingHitlBySession] = useState<Record<string, HitlPendingState>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopStreamRef = useRef<() => void>(() => {});
  const currentAgentRef = useRef<string>('');
  const currentSessionRef = useRef<string>('');
  const activeStreamRunRef = useRef<string>('');
  const activeStreamSessionKeyRef = useRef<string>('');
  const refreshTimerBySessionRef = useRef<Record<string, number>>({});
  const refreshSourceBySessionRef = useRef<Record<string, string[]>>({});
  const isHydratingMessagesRef = useRef(false);
  const sessionsByAgent = agentSessionStore.sessionsByAgent;
  const currentSessionByAgent = agentSessionStore.currentSessionByAgent;
  const messagesByAgentSession = agentSessionStore.messagesByAgentSession;

  const makeAgentSessionKey = (agentName: string, sid: string) => `${agentName}::${sid}`;
  const getSessionKey = (agentName?: string | null, sid?: string | null) => {
      if (!agentName || !sid) return '';
      return makeAgentSessionKey(agentName, sid);
  };
  const getActiveSessionKey = () => {
      const agentName = selectedAgent?.name;
      const sid = sessionId || (agentName ? currentSessionByAgent[agentName] : '');
      return getSessionKey(agentName, sid);
  };
  const getCurrentVersionIdFromUrl = () => {
      if (typeof window === 'undefined') return null;
      const params = new URLSearchParams(window.location.search);
      return params.get('version');
  };
  const getCurrentDocumentContext = () => {
      if (typeof window === 'undefined') {
          return { documentContent: '', documentTitle: '', versionId: null as string | null };
      }
      const windowWithContext = window as Window & { __DOCUMENT_HELPER_CONTEXT__?: DocumentHelperContextPayload };
      const payload = windowWithContext.__DOCUMENT_HELPER_CONTEXT__ || {};
      const versionId = payload.version_id || getCurrentVersionIdFromUrl();
      return {
          documentContent: typeof payload.document_content === 'string' ? payload.document_content : '',
          documentTitle: typeof payload.document_title === 'string' ? payload.document_title : '',
          versionId,
      };
  };
  const notifyDocumentRefresh = (source: string, sessionKey?: string) => {
      if (typeof window === 'undefined') return;
      window.dispatchEvent(new CustomEvent('document-helper:refresh', {
          detail: {
              source,
              session_key: sessionKey || '',
              work_id: workId,
              document_id: documentId,
              version_id: getCurrentVersionIdFromUrl(),
          }
      }));
  };
  const flushScheduledDocumentRefresh = (sessionKey: string) => {
      if (!sessionKey) return;
      const timerId = refreshTimerBySessionRef.current[sessionKey];
      if (timerId) {
          window.clearTimeout(timerId);
          delete refreshTimerBySessionRef.current[sessionKey];
      }
      const sources = refreshSourceBySessionRef.current[sessionKey] || [];
      if (sources.length === 0) return;
      delete refreshSourceBySessionRef.current[sessionKey];
      notifyDocumentRefresh(Array.from(new Set(sources)).join(','), sessionKey);
  };
  const scheduleDocumentRefresh = (sessionKey: string, source: string) => {
      if (!sessionKey) {
          notifyDocumentRefresh(source);
          return;
      }
      const sources = refreshSourceBySessionRef.current[sessionKey] || [];
      refreshSourceBySessionRef.current[sessionKey] = [...sources, source];
      if (refreshTimerBySessionRef.current[sessionKey]) {
          return;
      }
      refreshTimerBySessionRef.current[sessionKey] = window.setTimeout(() => {
          flushScheduledDocumentRefresh(sessionKey);
      }, 200);
  };
  const extractHitlActionRequest = (data: any): { name?: string; args?: unknown } | null => {
      const maybeRequests =
          data?.payload?.payload?.[0]?.action_requests ||
          data?.payload?.[0]?.action_requests ||
          data?.payload?.action_requests ||
          data?.action_requests ||
          [];
      if (!Array.isArray(maybeRequests) || maybeRequests.length === 0) {
          return null;
      }
      const firstRequest = maybeRequests[0];
      return {
          name: firstRequest?.name,
          args: firstRequest?.args,
      };
  };
  const normalizeAgentEvent = (data: any): NormalizedAgentEvent => {
      if (data?.status === 'error' || data?.event_type === 'error') {
          const errorMessage = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
          return { type: 'error', errorMessage };
      }
      const eventType = String(data?.event_type || '').toLowerCase();
      if (eventType === 'assistant_chunk') {
          return { type: 'assistant_chunk', content: typeof data?.content === 'string' ? data.content : '' };
      }
      if (eventType === 'tool_dispatch') {
          return {
              type: 'tool_dispatch',
              toolName: data?.tool_name,
              args: data?.args,
              message: data?.message,
          };
      }
      if (eventType === 'tool_result') {
          return {
              type: 'tool_result',
              toolName: data?.tool_name,
              content: typeof data?.content === 'string' ? data.content : JSON.stringify(data?.content ?? ''),
          };
      }
      if (eventType === 'hitl_interrupt') {
          return { type: 'hitl_interrupt', payload: data };
      }
      return { type: 'other', payload: data };
  };
  const reconstructArtifactsFromHistory = (historyMessages: any[], sessionKey: string) => {
      const messages: Message[] = [];
      const artifacts: Record<string, StreamArtifact[]> = {};
      const segments: Record<string, MessageSegment[]> = {};
      
      let lastAssistantMsgId: string | null = null;
      
      historyMessages.forEach((msg, index) => {
          const role = String(msg.role || '').toLowerCase();
          const type = String(msg.type || '').toLowerCase();
          // Fix: Ensure content is string, handle JSON objects
          let content = '';
          if (typeof msg.content === 'string') {
              content = msg.content;
          } else if (msg.content) {
              try {
                  content = JSON.stringify(msg.content);
              } catch (e) {
                  content = String(msg.content);
              }
          }

          if (role === 'user') {
              const msgId = `${sessionKey}-${index}-${Date.now()}`;
              messages.push({ id: msgId, role: 'user', content });
              lastAssistantMsgId = null;
          } else {
              // Assistant or Tool
              if (type === 'tool') {
                   // Tool Result - attach to last assistant message
                   if (lastAssistantMsgId) {
                       const artifactId = `${lastAssistantMsgId}-result-${index}`;
                       const artifact: StreamArtifact = {
                           id: artifactId,
                           type: 'tool_result',
                           toolName: msg.name || 'unknown_tool',
                           content: content,
                       };
                       if (!artifacts[lastAssistantMsgId]) artifacts[lastAssistantMsgId] = [];
                       artifacts[lastAssistantMsgId].push(artifact);
                       
                       // Add segment
                       if (!segments[lastAssistantMsgId]) segments[lastAssistantMsgId] = [];
                       segments[lastAssistantMsgId].push({
                           id: `${artifactId}-segment`,
                           type: 'artifact',
                           artifactId: artifactId
                       });
                   } else {
                       // Orphaned tool result - create new container message
                       const msgId = `${sessionKey}-${index}-${Date.now()}`;
                       messages.push({ id: msgId, role: 'assistant', content: '' }); 
                       lastAssistantMsgId = msgId;
                       
                       const artifactId = `${msgId}-result-${index}`;
                       const artifact: StreamArtifact = {
                           id: artifactId,
                           type: 'tool_result',
                           toolName: msg.name || 'unknown_tool',
                           content: content,
                       };
                       artifacts[msgId] = [artifact];
                       segments[msgId] = [{ id: `${artifactId}-segment`, type: 'artifact', artifactId }];
                   }
              } else {
                  // Assistant Message
                  const msgId = `${sessionKey}-${index}-${Date.now()}`;
                  lastAssistantMsgId = msgId;
                  messages.push({ id: msgId, role: 'assistant', content });
                  
                  // Initialize segments with text content if exists
                  if (content) {
                      segments[msgId] = [{ id: `${msgId}-text-init`, type: 'text', content }];
                  } else {
                      segments[msgId] = [];
                  }

                  // Handle Tool Calls (Dispatch)
                  const toolCalls = msg.tool_calls || [];
                  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
                      if (!artifacts[msgId]) artifacts[msgId] = [];
                      if (!segments[msgId]) segments[msgId] = [];
                      
                      toolCalls.forEach((call: any, callIdx: number) => {
                          const artifactId = `${msgId}-dispatch-${callIdx}`;
                          const artifact: StreamArtifact = {
                              id: artifactId,
                              type: 'tool_dispatch',
                              toolName: call.name,
                              args: call.args,
                          };
                          artifacts[msgId].push(artifact);
                          segments[msgId].push({
                              id: `${artifactId}-segment`,
                              type: 'artifact',
                              artifactId
                          });
                      });
                  }
              }
          }
      });
      return { messages, artifacts, segments };
  };

  const syncAgentHistorySnapshot = async (agentName: string) => {
      console.log('[AIAssistant] syncAgentHistorySnapshot start:', agentName);
      if (!agentManagerId) {
          console.warn('[AIAssistant] syncAgentHistorySnapshot aborted: No agentManagerId');
          return;
      }
      const response = await invokePluginOperation(agentManagerId, 'get_agent_info_in_card', {});
      const payload = (response?.payload || response) as Record<string, unknown>;
      const payloadData = (payload?.data as Record<string, unknown> | undefined) || undefined;
      const agentsList = payloadData?.agents || payload?.agents;
      if (!Array.isArray(agentsList)) {
          console.warn('[AIAssistant] syncAgentHistorySnapshot aborted: No agents list in response', response);
          return;
      }
      const targetAgent = agentsList.find((item: any) => (item?.name || item?.agent_name) === agentName);
      if (!targetAgent) {
          console.warn('[AIAssistant] syncAgentHistorySnapshot aborted: Target agent not found', agentName);
          return;
      }
      console.log('[AIAssistant] syncAgentHistorySnapshot found agent:', { 
          name: targetAgent.name, 
          historyLen: targetAgent.history?.length,
          currentSession: targetAgent.current_session_id 
      });

      const history = Array.isArray(targetAgent.history) ? targetAgent.history : [];
      const currentSession = targetAgent.current_session_id || history.at(-1)?.session_id || '';
      const sessionIds = history.map((item: any) => item?.session_id).filter(Boolean);
      const messagesBySession: Record<string, Message[]> = {};
      
      const allArtifacts: Record<string, StreamArtifact[]> = {};
      const allSegments: Record<string, MessageSegment[]> = {};

      history.forEach((item: any) => {
          const sid = item?.session_id;
          if (!sid) return;
          const sessionKey = makeAgentSessionKey(agentName, sid);
          const { messages, artifacts, segments } = reconstructArtifactsFromHistory(Array.isArray(item.messages) ? item.messages : [], sessionKey);
          
          messagesBySession[sessionKey] = messages.length > 0 ? messages : INITIAL_WELCOME_MESSAGES;
          Object.assign(allArtifacts, artifacts);
          Object.assign(allSegments, segments);
      });
      
      console.log('[AIAssistant] Hydrating snapshot:', {
          agentName,
          sessions: sessionIds,
          currentSession,
          messagesCountBySession: Object.fromEntries(Object.entries(messagesBySession).map(([k, v]) => [k, v.length])),
          artifactsCount: Object.keys(allArtifacts).length
      });
      
      // Update local state for artifacts/segments
      setArtifactsByMessageId(prev => ({ ...prev, ...allArtifacts }));
      setSegmentsByMessageId(prev => ({ ...prev, ...allSegments }));

      dispatchAgentSession({
          type: 'hydrate_agent_snapshot',
          payload: { agentName, sessions: sessionIds, currentSession, messagesBySession },
      });
      if (currentSession) {
          setSessionId(currentSession);
      }
  };

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
                  const payload = (res?.payload || res) as Record<string, any>;
                  const payloadData = payload?.data as Record<string, any> | undefined;
                  const agentsList = payloadData?.agents || payload?.agents;
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
                  const nextArtifacts: Record<string, StreamArtifact[]> = {};
                  const nextSegments: Record<string, MessageSegment[]> = {};

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
                          const sessionKey = makeAgentSessionKey(agentName, sid);
                          const { messages, artifacts, segments } = reconstructArtifactsFromHistory(
                              h.messages || [],
                              sessionKey
                          );
                          nextMessagesByAgentSession[sessionKey] = messages.length > 0 ? messages : INITIAL_WELCOME_MESSAGES;
                          Object.assign(nextArtifacts, artifacts);
                          Object.assign(nextSegments, segments);
                      });

                      const currentKey = makeAgentSessionKey(agentName, currentSession);
                      if (!nextMessagesByAgentSession[currentKey]) {
                          nextMessagesByAgentSession[currentKey] = INITIAL_WELCOME_MESSAGES;
                      }
                  });
                  
                  setArtifactsByMessageId(prev => ({ ...prev, ...nextArtifacts }));
                  setSegmentsByMessageId(prev => ({ ...prev, ...nextSegments }));

                  dispatchAgentSession({
                      type: 'replace_all',
                      payload: {
                          sessionsByAgent: nextSessionsByAgent,
                          currentSessionByAgent: nextCurrentSessionByAgent,
                          messagesByAgentSession: nextMessagesByAgentSession,
                      },
                  });
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
      const nextMessages = messagesByAgentSession[key] || INITIAL_WELCOME_MESSAGES;
      currentAgentRef.current = agentName;
      currentSessionRef.current = selectedSession;
      setSessionId(prev => (prev === selectedSession ? prev : selectedSession));
      setMessages(prev => {
          if (areMessagesEqual(prev, nextMessages)) {
              return prev;
          }
          isHydratingMessagesRef.current = true;
          return nextMessages;
      });
  }, [selectedAgent, currentSessionByAgent, messagesByAgentSession]);

  useEffect(() => {
      if (isHydratingMessagesRef.current) {
          isHydratingMessagesRef.current = false;
          return;
      }
      const agentName = currentAgentRef.current;
      const sid = currentSessionRef.current;
      if (!agentName || !sid) return;
      const key = makeAgentSessionKey(agentName, sid);
      const existing = messagesByAgentSession[key];
      if (!areMessagesEqual(existing, messages)) {
          dispatchAgentSession({
              type: 'set_messages_for_session',
              payload: { agentName, sessionId: sid, messages },
          });
      }
  }, [messages]);
  useEffect(() => {
      if (!selectedAgent || !agentManagerId) return;
      syncAgentHistorySnapshot(selectedAgent.name).catch((error) => {
          console.error('Failed to sync agent history snapshot:', error);
      });
  }, [selectedAgent?.name, agentManagerId]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, segmentsByMessageId, artifactsByMessageId]);
  useEffect(() => {
      return () => {
          Object.values(refreshTimerBySessionRef.current).forEach((timerId) => {
              window.clearTimeout(timerId);
          });
          refreshTimerBySessionRef.current = {};
          refreshSourceBySessionRef.current = {};
      };
  }, []);

  const handleSwitchSession = async (nextSessionId: string) => {
      if (!selectedAgent) return;
      if (isStreaming && stopStreamRef.current) {
          flushScheduledDocumentRefresh(activeStreamSessionKeyRef.current);
          stopStreamRef.current();
          setIsStreaming(false);
      }
      const agentName = selectedAgent.name;
      if (agentManagerId) {
          try {
              await invokePluginOperation(agentManagerId, 'switch_agent_session', {
                  agent_name: agentName,
                  session_id: nextSessionId
              });
              await syncAgentHistorySnapshot(agentName);
          } catch (e) {
              console.error('Failed to switch session on backend:', e);
          }
      }
      dispatchAgentSession({ type: 'set_current_session', payload: { agentName, sessionId: nextSessionId } });
      setSessionId(nextSessionId);
  };

  const handleCreateSession = async () => {
      if (!selectedAgent) return;
      const agentName = selectedAgent.name;
      let newSessionId = `session-${Date.now()}`;
      let createdByBackend = false;
      if (agentManagerId) {
          try {
              const res = await invokePluginOperation(agentManagerId, 'create_agent_session', { agent_name: agentName });
              const payload = res?.payload || res;
              if (payload?.session_id) {
                  newSessionId = String(payload.session_id);
                  createdByBackend = true;
              }
          } catch (e) {
              console.error('Failed to create session on backend:', e);
          }
      }
      if (createdByBackend) {
          await syncAgentHistorySnapshot(agentName);
      }
      dispatchAgentSession({
          type: 'upsert_session',
          payload: { agentName, sessionId: newSessionId, messages: INITIAL_WELCOME_MESSAGES },
      });
      dispatchAgentSession({ type: 'set_current_session', payload: { agentName, sessionId: newSessionId } });
      setSessionId(newSessionId);
      setMessages(INITIAL_WELCOME_MESSAGES);
  };
  const handleDeleteSession = async () => {
      if (!selectedAgent) return;
      if (isStreaming && stopStreamRef.current) {
          flushScheduledDocumentRefresh(activeStreamSessionKeyRef.current);
          stopStreamRef.current();
          setIsStreaming(false);
      }
      const agentName = selectedAgent.name;
      const deletingSessionId = currentSessionByAgent[agentName] || sessionId;
      if (!deletingSessionId) return;
      const currentList = sessionsByAgent[agentName] || [];
      if (currentList.length <= 1) {
          setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: 'system', content: '至少保留一个会话，无法删除最后一个会话。' }]);
          return;
      }
      if (agentManagerId) {
          try {
              await invokePluginOperation(agentManagerId, 'delete_agent_session', {
                  agent_name: agentName,
                  session_id: deletingSessionId,
              });
              await syncAgentHistorySnapshot(agentName);
              return;
          } catch (e) {
              console.error('Failed to delete session on backend:', e);
          }
      }
      const nextList = currentList.filter((item) => item !== deletingSessionId);
      const fallbackSessionId = nextList[nextList.length - 1] || '';
      dispatchAgentSession({
          type: 'delete_session',
          payload: { agentName, sessionId: deletingSessionId, fallbackSessionId },
      });
      setSessionId(fallbackSessionId);
  };

  const handleLocalHitlDecision = async (
      messageId: string,
      artifactId: string,
      decision: 'approve' | 'edit' | 'reject',
      editedAction?: { name: string; args: unknown }
  ) => {
      const reviewSessionKey = getActiveSessionKey();
      if (reviewSessionKey) {
          setPendingHitlBySession(prev => ({
              ...prev,
              [reviewSessionKey]: {
                  messageId,
                  artifactId,
                  status: 'resolving'
              }
          }));
      }
      setArtifactsByMessageId(prev => ({
          ...prev,
          [messageId]: (prev[messageId] || []).map(item =>
              item.id === artifactId
                  ? {
                      ...item,
                      status: decision === 'approve' ? 'approved' : decision === 'edit' ? 'edited' : 'rejected'
                  }
                  : item
          )
      }));
      if (!agentManagerId || !selectedAgent || !sessionId) {
          if (reviewSessionKey) {
              setPendingHitlBySession(prev => ({
                  ...prev,
                  [reviewSessionKey]: {
                      messageId,
                      artifactId,
                      status: 'pending'
                  }
              }));
          }
          setMessages(prev => [...prev, { id: `${Date.now()}`, role: 'system', content: `已记录人工决策：${decision}` }]);
          return;
      }
      const appendArtifactToMessage = (artifact: StreamArtifact) => {
          setArtifactsByMessageId(prev => ({
              ...prev,
              [messageId]: [...(prev[messageId] || []), artifact]
          }));
          setSegmentsByMessageId(prev => ({
              ...prev,
              [messageId]: [...(prev[messageId] || []), { id: `${artifact.id}-segment`, type: 'artifact', artifactId: artifact.id }]
          }));
      };
      const appendContentToMessage = (text: string) => {
          if (!text) return;
          setMessages(prev => prev.map(msg =>
              msg.id === messageId
                  ? { ...msg, content: msg.content + text }
                  : msg
          ));
          setSegmentsByMessageId(prev => {
              const existing = prev[messageId] || [];
              const last = existing[existing.length - 1];
              if (last && last.type === 'text') {
                  return {
                      ...prev,
                      [messageId]: [
                          ...existing.slice(0, -1),
                          { ...last, content: last.content + text }
                      ]
                  };
              }
              return {
                  ...prev,
                  [messageId]: [...existing, { id: `${messageId}-seg-text-${Date.now()}`, type: 'text', content: text }]
              };
          });
      };
      let reviewInterrupted = false;
      const applyReviewEvent = (data: any) => {
          const normalized = normalizeAgentEvent(data);
          if (normalized.type === 'assistant_chunk' && normalized.content) {
              appendContentToMessage(normalized.content);
              return;
          }
          if (normalized.type === 'tool_dispatch') {
              appendArtifactToMessage({
                  id: `${messageId}-dispatch-${Date.now()}`,
                  type: 'tool_dispatch',
                  toolName: normalized.toolName,
                  args: normalized.args,
                  message: normalized.message,
              });
              return;
          }
          if (normalized.type === 'tool_result') {
              scheduleDocumentRefresh(reviewSessionKey || '', 'review_tool_result');
              appendArtifactToMessage({
                  id: `${messageId}-result-${Date.now()}`,
                  type: 'tool_result',
                  toolName: normalized.toolName,
                  content: normalized.content,
              });
              return;
          }
          if (normalized.type === 'hitl_interrupt') {
              reviewInterrupted = true;
              const actionRequest = extractHitlActionRequest(normalized.payload);
              const artifact = {
                  id: `${messageId}-hitl-${Date.now()}`,
                  type: 'hitl_interrupt',
                  status: 'pending',
                  actionName: actionRequest?.name,
                  args: actionRequest?.args,
              } as StreamArtifact;
              appendArtifactToMessage(artifact);
              if (reviewSessionKey) {
                  setPendingHitlBySession(prev => ({
                      ...prev,
                      [reviewSessionKey]: {
                          messageId,
                          artifactId: artifact.id,
                          status: 'pending'
                      }
                  }));
              }
              return;
          }
          if (normalized.type === 'error') {
              if (reviewSessionKey) {
                  setPendingHitlBySession(prev => ({
                      ...prev,
                      [reviewSessionKey]: {
                          messageId,
                          artifactId,
                          status: 'pending'
                      }
                  }));
              }
              setMessages(prev => [...prev, { id: `${Date.now()}`, role: 'system', content: `审核恢复失败：${normalized.errorMessage || 'unknown error'}` }]);
          }
      };
      const baseUrl = config.work.apiBaseUrl.replace(/\/$/, '');
      const url = `${baseUrl}/api/v1/plugin/proxy/${agentManagerId}/proxy_resume_agent_review`;
      const contextPayload = getCurrentDocumentContext();
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              params: {
                  agent_name: selectedAgent.name,
                  session_id: sessionId,
                  decision,
                  edited_action: editedAction || null,
                  work_id: workId,
                  document_id: documentId,
                  version_id: contextPayload.versionId,
                  document_content: contextPayload.documentContent,
                  document_title: contextPayload.documentTitle,
              }
          }),
      });
      if (!response.ok) {
          if (reviewSessionKey) {
              setPendingHitlBySession(prev => ({
                  ...prev,
                  [reviewSessionKey]: {
                      messageId,
                      artifactId,
                      status: 'pending'
                  }
              }));
          }
          const raw = await response.text();
          setMessages(prev => [...prev, { id: `${Date.now()}`, role: 'system', content: `审核恢复失败：${raw || response.statusText}` }]);
          return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
          if (reviewSessionKey) {
              setPendingHitlBySession(prev => ({
                  ...prev,
                  [reviewSessionKey]: {
                      messageId,
                      artifactId,
                      status: 'pending'
                  }
              }));
          }
          return;
      }
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
              if (!line.trim()) continue;
              try {
                  applyReviewEvent(JSON.parse(line));
              } catch (e) {
                  console.error('Error parsing review event', e);
              }
          }
      }
      if (buffer.trim()) {
          try {
              applyReviewEvent(JSON.parse(buffer.trim()));
          } catch (e) {
              console.error('Error parsing final review event', e);
          }
      }
      if (reviewSessionKey && !reviewInterrupted) {
          flushScheduledDocumentRefresh(reviewSessionKey);
          setPendingHitlBySession(prev => {
              const next = { ...prev };
              delete next[reviewSessionKey];
              return next;
          });
      }
  };

  const handleSend = () => {
    if (!input.trim() || !selectedAgent) return;
    
    const activeAgentName = selectedAgent.name;
    const activeSessionId = sessionId || `session-${Date.now()}`;
    const activeSessionKey = getSessionKey(activeAgentName, activeSessionId);
    const streamRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeStreamRunRef.current = streamRunId;
    activeStreamSessionKeyRef.current = activeSessionKey;
    const isCurrentStreamRun = () =>
        activeStreamRunRef.current === streamRunId && activeStreamSessionKeyRef.current === activeSessionKey;
    
    console.log('[AIAssistant] handleSend start', { 
        agentName: activeAgentName, 
        sessionId: activeSessionId, 
        streamRunId 
    });

    const hasPendingHitl = activeSessionKey ? Boolean(pendingHitlBySession[activeSessionKey]) : false;
    if (hasPendingHitl) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '当前会话有待处理的人审节点，请先完成审批后再继续发送。' }]);
        return;
    }
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    if (!sessionId) {
        setSessionId(activeSessionId);
        dispatchAgentSession({
            type: 'upsert_session',
            payload: { agentName: activeAgentName, sessionId: activeSessionId },
        });
        dispatchAgentSession({
            type: 'set_current_session',
            payload: { agentName: activeAgentName, sessionId: activeSessionId },
        });
    }

    // Placeholder for assistant
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);
    setArtifactsByMessageId(prev => ({ ...prev, [assistantMsgId]: [] }));
    setSegmentsByMessageId(prev => ({ ...prev, [assistantMsgId]: [] }));
    const appendAssistantContent = (content: string) => {
        if (!content) return;
        setMessages(prev => prev.map(msg =>
            msg.id === assistantMsgId
                ? { ...msg, content: msg.content + content }
                : msg
        ));
        setSegmentsByMessageId(prev => {
            const existing = prev[assistantMsgId] || [];
            const last = existing[existing.length - 1];
            if (last && last.type === 'text') {
                return {
                    ...prev,
                    [assistantMsgId]: [
                        ...existing.slice(0, -1),
                        { ...last, content: last.content + content }
                    ]
                };
            }
            return {
                ...prev,
                [assistantMsgId]: [...existing, { id: `${assistantMsgId}-seg-text-${Date.now()}`, type: 'text', content }]
            };
        });
    };
    const appendArtifact = (artifact: StreamArtifact) => {
        setArtifactsByMessageId(prev => ({
            ...prev,
            [assistantMsgId]: [...(prev[assistantMsgId] || []), artifact]
        }));
        setSegmentsByMessageId(prev => ({
            ...prev,
            [assistantMsgId]: [...(prev[assistantMsgId] || []), { id: `${artifact.id}-segment`, type: 'artifact', artifactId: artifact.id }]
        }));
    };
    const appendToolDispatch = (toolName?: string, args?: unknown, message?: string) => {
        appendArtifact({
            id: `${assistantMsgId}-dispatch-${Date.now()}`,
            type: 'tool_dispatch',
            toolName,
            args,
            message
        });
    };
    const appendToolResult = (toolName?: string, content?: string) => {
        appendArtifact({
            id: `${assistantMsgId}-result-${Date.now()}`,
            type: 'tool_result',
            toolName,
            content
        });
    };
    const applyStreamEvent = (data: any) => {
        if (!isCurrentStreamRun()) {
            return { shouldAbort: true };
        }
        const normalized = normalizeAgentEvent(data);
        console.log('[AIAssistant] Stream event:', normalized.type, 
            normalized.type === 'assistant_chunk' ? (normalized.content?.slice(0, 30) + '...') : ''
        );

        if (normalized.type === 'error') {
            const errorText = normalized.errorMessage || 'unknown error';
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                    ? { ...msg, content: `后端报错：${errorText}` }
                    : msg
            ));
            return { shouldAbort: true };
        }
        if (normalized.type === 'assistant_chunk') {
            appendAssistantContent(normalized.content || '');
            return { shouldAbort: false };
        }
        if (normalized.type === 'tool_dispatch') {
            appendToolDispatch(normalized.toolName, normalized.args, normalized.message);
            return { shouldAbort: false };
        }
        if (normalized.type === 'tool_result') {
            scheduleDocumentRefresh(activeSessionKey, 'chat_tool_result');
            // Force immediate refresh for document content updates
            if (normalized.toolName === 'patch_document_content') {
                 notifyDocumentRefresh('patch_document_content_immediate', activeSessionKey);
            }
            appendToolResult(normalized.toolName, normalized.content || '');
            return { shouldAbort: false };
        }
        if (normalized.type === 'hitl_interrupt') {
            const actionRequest = extractHitlActionRequest(normalized.payload);
            const artifact = {
                id: `${assistantMsgId}-hitl-${Date.now()}`,
                type: 'hitl_interrupt',
                status: 'pending',
                actionName: actionRequest?.name,
                args: actionRequest?.args,
            } as StreamArtifact;
            appendArtifact(artifact);
            const sessionKey = getSessionKey(activeAgentName, activeSessionId);
            if (sessionKey) {
                setPendingHitlBySession(prev => ({
                    ...prev,
                    [sessionKey]: {
                        messageId: assistantMsgId,
                        artifactId: artifact.id,
                        status: 'pending'
                    }
                }));
            }
            return { shouldAbort: false };
        }
        if (typeof data === 'string') {
            appendAssistantContent(data);
            return { shouldAbort: false };
        }
        if (typeof data?.content === 'string') {
            appendAssistantContent(data.content);
            return { shouldAbort: false };
        }
        if (data?.messages && Array.isArray(data.messages)) {
            const lastMsg = data.messages[data.messages.length - 1];
            if (typeof lastMsg?.content === 'string') {
                appendAssistantContent(lastMsg.content);
            }
            return { shouldAbort: false };
        }
        if (data?.output) {
            const outputText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
            appendAssistantContent(outputText);
            return { shouldAbort: false };
        }
        return { shouldAbort: false };
    };

    // Use Plugin Proxy for streaming if we have the plugin ID
    if (agentManagerId) {
        // Construct URL with API prefix manually since we are using raw fetch for streaming
        const baseUrl = config.work.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
        const url = `${baseUrl}/api/v1/plugin/proxy/${agentManagerId}/proxy_send_agent_message`;
        const controller = new AbortController();
        const contextPayload = getCurrentDocumentContext();
        
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                params: {
                    agent_name: selectedAgent.name,
                    message: input,
                    session_id: activeSessionId,
                    work_id: workId,
                    document_id: documentId,
                    version_id: contextPayload.versionId,
                    document_content: contextPayload.documentContent,
                    document_title: contextPayload.documentTitle,
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
                        const applied = applyStreamEvent(data);
                        if (applied.shouldAbort) {
                            setIsStreaming(false);
                            controller.abort();
                            return;
                        }
                    } catch (e) {
                        console.error("Error parsing NDJSON line", e);
                    }
                }
            }

            if (buffer.trim()) {
                try {
                    const data = JSON.parse(buffer.trim());
                    const applied = applyStreamEvent(data);
                    if (applied.shouldAbort) {
                        setIsStreaming(false);
                        controller.abort();
                        return;
                    }
                } catch (e) {
                    console.error("Error parsing final NDJSON buffer", e);
                }
            }
            if (isCurrentStreamRun()) {
                console.log('[AIAssistant] Stream finished normally. Syncing snapshot...');
                flushScheduledDocumentRefresh(activeSessionKey);
                await syncAgentHistorySnapshot(activeAgentName);
                setIsStreaming(false);
            }
        }).catch(err => {
            if (err.name === 'AbortError') return;
            console.error('Chat error:', err);
            setIsStreaming(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '对话出错: ' + String(err) }]);
        });

        stopStreamRef.current = () => {
            flushScheduledDocumentRefresh(activeSessionKey);
            activeStreamRunRef.current = '';
            controller.abort();
        };
        return;
    }

    // Fallback to old agentService if plugin ID not found (e.g. mock mode)
    const stop = agentService.chatStream(
        selectedAgent.id, // Ensure this ID is correct for backend routing
        activeSessionId,
        { 
            messages_type: 'text', 
            context: input
        },
        () => {},
        () => {
            if (!isCurrentStreamRun()) return;
            void (async () => {
                flushScheduledDocumentRefresh(activeSessionKey);
                await syncAgentHistorySnapshot(activeAgentName);
                setIsStreaming(false);
            })();
        },
        (err) => {
            if (!isCurrentStreamRun()) return;
            console.error('Chat error:', err);
            setIsStreaming(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '对话出错: ' + String(err) }]);
        },
        (event) => {
            if (!isCurrentStreamRun() || event.type === 'done') return;
            const eventPayload = event.type === 'error'
                ? { event_type: 'error', message: event.error_message || 'unknown error' }
                : (event.payload ?? event.content ?? event.raw ?? '');
            const applied = applyStreamEvent(eventPayload);
            if (applied.shouldAbort) {
                setIsStreaming(false);
                stopStreamRef.current();
            }
        },
    );
    
    stopStreamRef.current = () => {
        flushScheduledDocumentRefresh(activeSessionKey);
        activeStreamRunRef.current = '';
        stop();
    };
  };

  const handleStop = () => {
      if (stopStreamRef.current) {
          flushScheduledDocumentRefresh(activeStreamSessionKeyRef.current);
          activeStreamRunRef.current = '';
          stopStreamRef.current();
          setIsStreaming(false);
      }
  };
  const activeSessionKey = getActiveSessionKey();
  const activeHitlState = activeSessionKey ? pendingHitlBySession[activeSessionKey] : undefined;
  const isHitlBlocked = Boolean(activeHitlState);

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
                    <button
                        onClick={handleDeleteSession}
                        className="p-1 rounded border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300"
                        title="删除当前会话"
                    >
                        <Trash2 size={12} />
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
            <div className={`${msg.role === 'system' ? 'w-full max-w-full' : 'max-w-[80%]'}`}>
                {!(msg.role === 'assistant' && (segmentsByMessageId[msg.id] || []).length > 0) ? (
                    <div className={`
                        p-3 rounded-2xl text-sm leading-relaxed shadow-sm border overflow-hidden
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
                ) : null}
                {msg.role === 'assistant' ? (
                    (() => {
                        const segments = segmentsByMessageId[msg.id] || [];
                        if (segments.length === 0) {
                            return (artifactsByMessageId[msg.id] || []).map((artifact) => (
                                artifact.type === 'tool_dispatch' ? (
                                    <ToolDispatchCard
                                        key={artifact.id}
                                        title={`工具调度 · ${artifact.toolName || 'unknown_tool'}`}
                                        subtitle={artifact.message}
                                        payload={artifact.args}
                                    />
                                ) : artifact.type === 'tool_result' ? (
                                    <ToolDispatchCard
                                        key={artifact.id}
                                        title={`工具结果 · ${artifact.toolName || 'tool'}`}
                                        subtitle={artifact.content}
                                    />
                                ) : (
                                    <HumanInTheLoopCard
                                        key={artifact.id}
                                        status={artifact.status || 'pending'}
                                        actionName={artifact.actionName}
                                        args={artifact.args}
                                        onDecision={(decision, editedAction) => handleLocalHitlDecision(msg.id, artifact.id, decision, editedAction)}
                                    />
                                )
                            ));
                        }
                        const artifacts = artifactsByMessageId[msg.id] || [];
                        const artifactMap = new Map(artifacts.map((item) => [item.id, item]));
                        return segments.map((segment) => {
                            if (segment.type === 'text') {
                                return (
                                    <div key={segment.id} className="mt-2 prose prose-sm max-w-none prose-p:my-0">
                                        <ReactMarkdown>{segment.content}</ReactMarkdown>
                                    </div>
                                );
                            }
                            const artifact = artifactMap.get(segment.artifactId);
                            if (!artifact) return null;
                            if (artifact.type === 'tool_dispatch') {
                                return (
                                    <ToolDispatchCard
                                        key={segment.id}
                                        title={`工具调度 · ${artifact.toolName || 'unknown_tool'}`}
                                        subtitle={artifact.message}
                                        payload={artifact.args}
                                    />
                                );
                            }
                            if (artifact.type === 'tool_result') {
                                return (
                                    <ToolDispatchCard
                                        key={segment.id}
                                        title={`工具结果 · ${artifact.toolName || 'tool'}`}
                                        subtitle={artifact.content}
                                    />
                                );
                            }
                            return (
                                <HumanInTheLoopCard
                                    key={segment.id}
                                    status={artifact.status || 'pending'}
                                    actionName={artifact.actionName}
                                    args={artifact.args}
                                    onDecision={(decision, editedAction) => handleLocalHitlDecision(msg.id, artifact.id, decision, editedAction)}
                                />
                            );
                        });
                    })()
                ) : null}
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
                placeholder={
                    isHitlBlocked
                        ? '当前会话等待人工审批，完成后可继续对话...'
                        : selectedAgent
                            ? `发送给 ${selectedAgent.name}...`
                            : (agents.length === 0 ? "加载 Agent 列表..." : "请选择一个 Agent...")
                }
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
                disabled={isStreaming || isHitlBlocked}
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
                    disabled={!input.trim() || !selectedAgent || isStreaming || isHitlBlocked}
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

"use client";
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { PluginConfig, PluginInstance, StandardDataResponse, ConfigField } from '@/types/plugin';
import { getPluginData } from '@/services/pluginService';

interface PluginSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: PluginInstance;
  onSave: (config: PluginConfig) => void;
}

export default function PluginSettingsModal({ isOpen, onClose, plugin, onSave }: PluginSettingsModalProps) {
  const [configJson, setConfigJson] = useState(JSON.stringify(plugin.config, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [panelRatio, setPanelRatio] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<StandardDataResponse | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setConfigJson(JSON.stringify(plugin.config, null, 2));
    setError(null);
  }, [plugin.id, plugin.config]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingData(true);
    setDataError(null);
    getPluginData(plugin.id)
      .then((response) => {
        if (active) setData(response);
      })
      .catch(() => {
        if (active) setDataError('无法获取插件数据');
      })
      .finally(() => {
        if (active) setIsLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, plugin.id]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, ratio));
      if (clamped < 3) {
        setPanelRatio(0);
        return;
      }
      if (clamped > 97) {
        setPanelRatio(100);
        return;
      }
      setPanelRatio(clamped);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const config = JSON.parse(configJson) as PluginConfig;
      onSave(config);
      onClose();
    } catch {
      setError('Invalid JSON format');
    }
  };

  const renderConfigFields = (fields: ConfigField[], depth = 0) => {
    return fields.map((field) => (
      <div key={`${field.key}-${depth}`} className="space-y-1" style={{ paddingLeft: depth * 12 }}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-primary font-medium">
            {field.label || field.key}
          </span>
          <span className="text-xs text-text-secondary">{field.value_type}</span>
        </div>
        <div className="rounded-md border border-border-primary bg-surface-secondary px-3 py-2 text-sm text-text-primary">
          {field.value ?? '-'}
        </div>
        {field.children.length > 0 && (
          <div className="space-y-2">
            {renderConfigFields(field.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const content = useMemo(() => {
    if (!data) return null;
    switch (data.render_type) {
      case 'CONFIG': {
        const payload = data.payload as { fields: ConfigField[] };
        return (
          <div className="space-y-4">
            {payload.fields.length === 0 ? (
              <div className="text-sm text-text-secondary">暂无配置项</div>
            ) : (
              renderConfigFields(payload.fields)
            )}
          </div>
        );
      }
      case 'AGENT_MESSAGES': {
        const payload = data.payload as { sessions: Array<{ session_id: string; title?: string | null; source?: string | null; created_at?: string | null; token_usage?: number | null; }> };
        return (
          <div className="space-y-3">
            {payload.sessions.length === 0 ? (
              <div className="text-sm text-text-secondary">暂无会话记录</div>
            ) : (
              payload.sessions.map((session) => (
                <div key={session.session_id} className="rounded-lg border border-border-primary bg-surface-secondary p-3 space-y-1">
                  <div className="text-sm font-medium text-text-primary">{session.title || session.session_id}</div>
                  <div className="text-xs text-text-secondary flex flex-wrap gap-2">
                    {session.source && <span>来源: {session.source}</span>}
                    {session.created_at && <span>时间: {session.created_at}</span>}
                    {session.token_usage !== null && session.token_usage !== undefined && (
                      <span>Token: {session.token_usage}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      }
      case 'CARD': {
        const payload = data.payload as { cards: Array<{ id: string; title: string; summary?: string | null; tags: string[] }> };
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payload.cards.length === 0 ? (
              <div className="text-sm text-text-secondary">暂无卡片数据</div>
            ) : (
              payload.cards.map((card) => (
                <div key={card.id} className="rounded-lg border border-border-primary bg-surface-secondary p-3 space-y-2">
                  <div className="text-sm font-medium text-text-primary">{card.title}</div>
                  {card.summary && <div className="text-xs text-text-secondary line-clamp-3">{card.summary}</div>}
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-white border border-border-primary text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );
      }
      case 'LIST': {
        const payload = data.payload as { items: Array<{ id: string; title: string; subtitle?: string | null; content?: string | null; tags: string[]; metadata: Array<{ key: string; value: string | number | boolean | null }> }> };
        return (
          <div className="space-y-3">
            {payload.items.length === 0 ? (
              <div className="text-sm text-text-secondary">暂无列表数据</div>
            ) : (
              payload.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border-primary bg-surface-secondary p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.title}</div>
                      {item.subtitle && <div className="text-xs text-text-secondary">{item.subtitle}</div>}
                    </div>
                  </div>
                  {item.content && <div className="text-xs text-text-secondary">{item.content}</div>}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-white border border-border-primary text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.metadata.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                      {item.metadata.map((meta) => (
                        <div key={`${item.id}-${meta.key}`} className="flex items-center justify-between">
                          <span>{meta.key}</span>
                          <span className="text-text-primary">{meta.value ?? '-'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );
      }
      case 'DETAIL': {
        const payload = data.payload as { detail: { id: string; title: string; content?: string | null; fields: Array<{ key: string; value: string | number | boolean | null }> } };
        return (
          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold text-text-primary">{payload.detail.title}</div>
              {payload.detail.content && <div className="text-sm text-text-secondary mt-2">{payload.detail.content}</div>}
            </div>
            {payload.detail.fields.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {payload.detail.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between rounded-md border border-border-primary bg-surface-secondary px-3 py-2 text-sm">
                    <span className="text-text-secondary">{field.key}</span>
                    <span className="text-text-primary">{field.value ?? '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'DASHBOARD': {
        const payload = data.payload as { widgets: Array<{ id: string; title: string; value: string | number | boolean | null; unit?: string | null; tags: string[] }> };
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payload.widgets.length === 0 ? (
              <div className="text-sm text-text-secondary">暂无指标</div>
            ) : (
              payload.widgets.map((widget) => (
                <div key={widget.id} className="rounded-lg border border-border-primary bg-surface-secondary p-3 space-y-2">
                  <div className="text-xs text-text-secondary">{widget.title}</div>
                  <div className="text-2xl font-semibold text-text-primary">
                    {widget.value ?? '-'}{widget.unit ? <span className="text-sm text-text-secondary ml-1">{widget.unit}</span> : null}
                  </div>
                  {widget.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {widget.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-white border border-border-primary text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );
      }
      default:
        return null;
    }
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-white w-full max-w-5xl h-[70vh] rounded-xl shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h3 className="font-bold text-lg text-text-primary">配置: {plugin.manifest.name}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: `${panelRatio}% 8px ${100 - panelRatio}%` }}>
          <div className="flex flex-col min-w-0 border-r border-border-primary">
            <div className="px-4 py-3 border-b border-border-primary text-sm text-text-secondary">插件配置</div>
            <div className="p-4 overflow-auto space-y-3">
              <textarea
                className="w-full min-h-[300px] font-mono text-sm p-3 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-surface-secondary"
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value);
                  setError(null);
                }}
              />
              {error && <p className="text-error text-xs">{error}</p>}
            </div>
          </div>
          <div
            className="relative cursor-col-resize bg-surface-secondary/70"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setIsDragging(true);
            }}
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-primary" />
            <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-border-primary text-sm text-text-secondary flex items-center justify-between">
              <span>插件数据</span>
              {data?.render_type && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-border-primary bg-surface-secondary text-text-secondary">
                  {data.render_type}
                </span>
              )}
            </div>
            <div className="p-4 overflow-auto">
              {isLoadingData ? (
                <div className="text-sm text-text-secondary">加载中...</div>
              ) : dataError ? (
                <div className="text-sm text-error">{dataError}</div>
              ) : data ? (
                content
              ) : (
                <div className="text-sm text-text-secondary">暂无数据</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3">
          <button 
             onClick={onClose}
             className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
             取消
          </button>
          <button 
             onClick={handleSave}
             className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
          >
             <Save className="w-4 h-4" />
             保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

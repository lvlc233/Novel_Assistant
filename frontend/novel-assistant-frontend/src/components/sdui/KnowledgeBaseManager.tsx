import React, { useState, useEffect, useCallback } from 'react';
import { Database, Loader2, Plus, Edit, Trash2, Check, X, BookOpen, FileText, Settings, Search } from 'lucide-react';
import { invokePluginOperation } from '@/services/pluginService';
import { getWorkList } from '@/services/workService';

interface KB {
  id: string;
  title: string;
  description?: string;
  work_id?: string;
  enabled: boolean;
  create_at: string;
}

interface Chunk {
  chunk_id: string;
  enabled: boolean;
  search_keys?: string[];
  context: string;
  create_at: string;
  update_at?: string;
}

interface Novel {
  id: string;
  title: string;
}

interface KnowledgeBaseManagerProps {
  data?: {
    kbs: KB[];
  };
  pluginId: string;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ data, pluginId }) => {
  // Global State
  const [kbs, setKbs] = useState<KB[]>(data?.kbs || []);
  const [works, setWorks] = useState<Novel[]>([]);
  const [isLoadingKbs, setIsLoadingKbs] = useState(false);
  
  // Selection State
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  
  // Chunks State
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // Modals
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KB | null>(null);
  const [kbForm, setKbForm] = useState({ title: '', description: '', work_id: '' });

  const [isChunkModalOpen, setIsChunkModalOpen] = useState(false);
  const [editingChunk, setEditingChunk] = useState<Chunk | null>(null);
  const [chunkForm, setChunkForm] = useState({ context: '', search_keys: '' });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch KBs
  const fetchKbs = useCallback(async () => {
    try {
      setIsLoadingKbs(true);
      const result = await invokePluginOperation(pluginId, 'get_kd_list', {});
      if (result.payload) {
        setKbs(result.payload as KB[]);
      }
    } catch (error) {
      console.error('Failed to fetch KBs:', error);
    } finally {
      setIsLoadingKbs(false);
    }
  }, [pluginId]);

  // Fetch Works
  const fetchWorks = useCallback(async () => {
    try {
      const workData = await getWorkList("");
      setWorks(workData);
    } catch (error) {
      console.error('Failed to fetch Works:', error);
    }
  }, []);

  // Fetch Chunks for selected KB
  const fetchChunks = useCallback(async (kbId: string) => {
    try {
      setIsLoadingChunks(true);
      const result = await invokePluginOperation(pluginId, 'get_kd_detail', { kd_id: kbId });
      if (result.payload) {
        setChunks(result.payload as Chunk[]);
      }
    } catch (error) {
      console.error('Failed to fetch Chunks:', error);
      setChunks([]);
    } finally {
      setIsLoadingChunks(false);
    }
  }, [pluginId]);

  // Initial loads
  useEffect(() => {
    if (!data?.kbs?.length) fetchKbs();
    fetchWorks();
  }, [data?.kbs, fetchKbs, fetchWorks]);

  // Load chunks when selection changes
  useEffect(() => {
    if (selectedKbId) {
      fetchChunks(selectedKbId);
    } else {
      setChunks([]);
    }
  }, [selectedKbId, fetchChunks]);

  // --- KB Handlers ---
  const handleOpenKbModal = (kb?: KB) => {
    if (kb) {
      setEditingKb(kb);
      setKbForm({ title: kb.title, description: kb.description || '', work_id: kb.work_id || '' });
    } else {
      setEditingKb(null);
      setKbForm({ title: '', description: '', work_id: '' });
    }
    setIsKbModalOpen(true);
  };

  const handleSaveKb = async () => {
    if (!kbForm.title.trim()) return;
    try {
      setIsSaving(true);
      if (editingKb) {
        await invokePluginOperation(pluginId, 'update_kd', {
          kd_id: editingKb.id,
          request: { 
            enabled: editingKb.enabled,
            title: kbForm.title, 
            description: kbForm.description, 
            work_id: kbForm.work_id || undefined 
          }
        });
      } else {
        await invokePluginOperation(pluginId, 'create_kd', {
          request: { title: kbForm.title, description: kbForm.description, work_id: kbForm.work_id || undefined }
        });
      }
      await fetchKbs();
      setIsKbModalOpen(false);
    } catch (error) {
      console.error('Failed to save KB:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKb = async (kb: KB) => {
    if (!window.confirm(`Are you sure you want to delete the Knowledge Base "${kb.title}" and ALL its chunks?`)) return;
    try {
      await invokePluginOperation(pluginId, 'delete_kd', { kd_id: kb.id });
      if (selectedKbId === kb.id) setSelectedKbId(null);
      await fetchKbs();
    } catch (error) {
      console.error('Failed to delete KB:', error);
    }
  };

  // --- Chunk Handlers ---
  const handleOpenChunkModal = (chunk?: Chunk) => {
    if (chunk) {
      setEditingChunk(chunk);
      setChunkForm({ context: chunk.context, search_keys: (chunk.search_keys || []).join(', ') });
    } else {
      setEditingChunk(null);
      setChunkForm({ context: '', search_keys: '' });
    }
    setIsChunkModalOpen(true);
  };

  const handleSaveChunk = async () => {
    if (!selectedKbId || !chunkForm.context.trim()) return;
    const parsedKeys = chunkForm.search_keys.split(',').map(s => s.trim()).filter(Boolean);

    try {
      setIsSaving(true);
      if (editingChunk) {
        await invokePluginOperation(pluginId, 'update_kd_chunk', {
          kd_id: selectedKbId,
          chunk_id: editingChunk.chunk_id,
          request: { 
            enabled: editingChunk.enabled,
            context: chunkForm.context, 
            search_keys: parsedKeys 
          }
        });
      } else {
        await invokePluginOperation(pluginId, 'create_kd_chunk', {
          kd_id: selectedKbId,
          request: { 
            chunk_id: crypto.randomUUID(), 
            context: chunkForm.context, 
            search_keys: parsedKeys 
          }
        });
      }
      await fetchChunks(selectedKbId);
      setIsChunkModalOpen(false);
    } catch (error) {
      console.error('Failed to save Chunk:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChunk = async (chunk: Chunk) => {
    if (!selectedKbId || !window.confirm('Delete this knowledge chunk?')) return;
    try {
      await invokePluginOperation(pluginId, 'delete_kd_chunk', {
        kd_id: selectedKbId,
        chunk_id: chunk.chunk_id
      });
      await fetchChunks(selectedKbId);
    } catch (error) {
      console.error('Failed to delete Chunk:', error);
    }
  };

  const handleToggleChunk = async (chunk: Chunk) => {
    if (!selectedKbId) return;
    try {
      setChunks(prev => prev.map(c => c.chunk_id === chunk.chunk_id ? { ...c, enabled: !c.enabled } : c));
      await invokePluginOperation(pluginId, 'update_kd_chunk', {
        kd_id: selectedKbId,
        chunk_id: chunk.chunk_id,
        request: { 
          enabled: !chunk.enabled,
          context: chunk.context,
          search_keys: chunk.search_keys || []
        }
      });
    } catch (error) {
      console.error('Failed to toggle chunk:', error);
      setChunks(prev => prev.map(c => c.chunk_id === chunk.chunk_id ? { ...c, enabled: chunk.enabled } : c));
    }
  };

  return (
    <div className="flex absolute inset-0 text-gray-800 gap-6">
      
      {/* LEFT PANE: KD List */}
      <div className="w-1/3 min-w-[280px] max-w-sm border-r border-gray-100 pr-6 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Database className="w-4 h-4" />
            <span>Knowledge Bases</span>
          </div>
          <button
            onClick={() => handleOpenKbModal()}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100"
            title="Create Knowledge Base"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto space-y-2 pr-2">
            {isLoadingKbs && kbs.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : kbs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No knowledge bases found.</div>
            ) : (
              kbs.map(kb => (
                <div 
                  key={kb.id}
                  onClick={() => setSelectedKbId(kb.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${
                    selectedKbId === kb.id 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`font-bold text-sm truncate pr-2 ${selectedKbId === kb.id ? 'text-blue-900' : 'text-gray-800'}`}>
                      {kb.title}
                    </h4>
                    
                    {/* Hover Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white/80 p-1 rounded-md backdrop-blur-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenKbModal(kb); }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteKb(kb); }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {kb.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{kb.description}</p>
                  )}

                  {/* Badges / Meta */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {kb.work_id && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-50 text-amber-600 border border-amber-100">
                        <BookOpen className="w-3 h-3" />
                        {works.find(w => w.id === kb.work_id)?.title || 'Unknown Work'}
                      </span>
                    )}
                    {!kb.enabled && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Chunks List */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {!selectedKbId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Database className="w-12 h-12 text-gray-200 mb-4" />
            <h4 className="text-sm font-bold text-gray-600 mb-2">Select a Knowledge Base</h4>
            <p className="text-xs max-w-sm text-center">Choose a knowledge base from the left panel to manage its underlying content and knowledge chunks.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <FileText className="w-4 h-4" />
                  <span>Knowledge Chunks</span>
                </div>
              </div>
              
              <button
                onClick={() => handleOpenChunkModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Chunk
              </button>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-0 overflow-y-auto space-y-4 pr-2">
                {isLoadingChunks ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : chunks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl mx-10">
                    <FileText className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500">No knowledge chunks yet</p>
                    <p className="text-xs mt-1">Add text facts that the agent can retrieve and read.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 w-full">
                    {chunks.map(chunk => (
                      <div key={chunk.chunk_id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${chunk.enabled ? 'border-gray-200 hover:border-blue-200' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex items-center justify-between bg-gray-50/50 px-4 py-2.5 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-gray-400 bg-white px-2 py-0.5 border border-gray-100 rounded">
                              ID: {chunk.chunk_id.substring(0, 8)}...
                            </span>
                            {chunk.search_keys && (
                              <div className="flex gap-1.5 flex-wrap">
                                {chunk.search_keys.map((key, i) => (
                                  <span key={i} className="flex items-center gap-1 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-600 px-1.5 py-0.5 border border-indigo-100">
                                    <Search className="w-2.5 h-2.5" />
                                    {key.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <label className="relative inline-flex items-center cursor-pointer mr-2">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={chunk.enabled}
                                onChange={() => handleToggleChunk(chunk)}
                              />
                              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <button 
                              onClick={() => handleOpenChunkModal(chunk)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteChunk(chunk)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-serif leading-relaxed">
                          {chunk.context}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* KB Modal */}
      {isKbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">{editingKb ? 'Edit Knowledge Base' : 'New Knowledge Base'}</h3>
              <button onClick={() => setIsKbModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={kbForm.title}
                  onChange={e => setKbForm({ ...kbForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g., Magic System Rules"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={kbForm.description}
                  onChange={e => setKbForm({ ...kbForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Optional context about this knowledge base..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Associated Work (Optional)</label>
                <select
                  value={kbForm.work_id}
                  onChange={e => setKbForm({ ...kbForm, work_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- No specific work (Global Knowledge) --</option>
                  {works.map(w => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">If selected, agents will filter this knowledge base directly by the active novel context.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setIsKbModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleSaveKb} disabled={!kbForm.title.trim() || isSaving} className="flex flex-row items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chunk Modal */}
      {isChunkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">{editingChunk ? 'Edit Chunk' : 'Add Knowledge Chunk'}</h3>
              <button onClick={() => setIsChunkModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Search Keys (Comma Separated)</label>
                <input
                  type="text"
                  value={chunkForm.search_keys}
                  onChange={e => setChunkForm({ ...chunkForm, search_keys: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g., magic, spells, fire"
                />
                 <p className="text-[10px] text-gray-500 mt-1">These keys dramatically improve retrieval accuracy by providing index hints to the RAG system.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Content <span className="text-red-500">*</span></label>
                <textarea
                  value={chunkForm.context}
                  onChange={e => setChunkForm({ ...chunkForm, context: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm h-64 resize-none font-serif leading-relaxed"
                  placeholder="Enter the factual knowledge text..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setIsChunkModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleSaveChunk} disabled={!chunkForm.context.trim() || isSaving} className="flex flex-row items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

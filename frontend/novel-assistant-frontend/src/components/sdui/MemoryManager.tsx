import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, Loader2, Plus, Edit, Trash2, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { invokePluginOperation } from '@/services/pluginService';

interface Memory {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  create_at: string;
  type?: string;
  content?: string;
  tags?: string[];
}

interface MemoryManagerProps {
  data?: {
    memories: Memory[];
  };
  pluginId: string;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ data, pluginId }) => {
  const [memories, setMemories] = useState<Memory[]>(data?.memories || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'LONG_TERM',
    description: '',
    content: '',
    tags: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all memories logic
  const fetchMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invokePluginOperation(pluginId, 'get_memory_list', {});
      if (result.payload) {
        setMemories(result.payload as Memory[]);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pluginId]);

  useEffect(() => {
    if (!data?.memories?.length) {
      fetchMemories();
    }
  }, [data?.memories, fetchMemories]);

  const handleOpenModal = async (memory?: Memory) => {
    if (memory) {
      try {
        setIsLoading(true);
        const result = await invokePluginOperation(pluginId, 'get_memory_detail', { memory_id: memory.id });
        if (result.payload) {
          const detail = result.payload as Memory;
          setEditingMemory(detail);
          setFormData({
            title: detail.title,
            type: detail.type || 'LONG_TERM',
            description: detail.description || '',
            content: detail.content || '',
            tags: detail.tags || []
          });
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error('Error fetching detail', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setEditingMemory(null);
      setFormData({
        title: '',
        type: 'LONG_TERM',
        description: '',
        content: '',
        tags: []
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMemory(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      setIsSaving(true);
      if (editingMemory) {
        await invokePluginOperation(pluginId, 'update_memory', {
          memory_id: editingMemory.id,
          request: {
            title: formData.title,
            type: formData.type,
            description: formData.description,
            content: formData.content,
            tags: formData.tags
          }
        });
      } else {
        await invokePluginOperation(pluginId, 'create_memory', {
          request: {
            title: formData.title,
            type: formData.type,
            description: formData.description,
            content: formData.content,
            tags: formData.tags
          }
        });
      }
      await fetchMemories();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save memory:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (memory: Memory) => {
    try {
      setMemories(prev => prev.map(m => m.id === memory.id ? { ...m, enabled: !m.enabled } : m));
      await invokePluginOperation(pluginId, 'update_memory', {
        memory_id: memory.id,
        request: { enabled: !memory.enabled }
      });
    } catch (error) {
      console.error('Failed to toggle memory:', error);
      setMemories(prev => prev.map(m => m.id === memory.id ? { ...m, enabled: memory.enabled } : m));
    }
  };

  const handleDelete = async (memory: Memory) => {
    if (!window.confirm('Delete this memory?')) return;
    try {
      await invokePluginOperation(pluginId, 'delete_memory', { memory_id: memory.id });
      await fetchMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const handleAutoOrganize = async () => {
    try {
      setIsOrganizing(true);
      await invokePluginOperation(pluginId, 'auto_organize', {});
      await fetchMemories();
    } catch (error) {
      console.error('Failed to auto organize:', error);
    } finally {
      setIsOrganizing(false);
    }
  };

  return (
    <div className="flex flex-col absolute inset-0 text-gray-800">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-800">Agent Memory</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMemories}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100"
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleAutoOrganize}
            disabled={isOrganizing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 border border-indigo-100"
          >
            {isOrganizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Auto Organize
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Memory
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-y-auto px-6 pb-6 space-y-3">
        {memories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <BrainCircuit className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">No Memories Found</h4>
            <p className="text-sm text-gray-500 max-w-sm">
              The agent hasn't remembered anything yet. Memories can be created manually or automatically through interactions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            {memories.map(memory => (
              <div key={memory.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-200 ${memory.enabled ? 'border-gray-200 hover:border-purple-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`font-bold text-base truncate ${memory.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {memory.title}
                      </h4>
                      {memory.type && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-50 text-purple-600 border border-purple-100">
                          {memory.type}
                        </span>
                      )}
                      {!memory.enabled && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-100 text-gray-500 border border-gray-200">
                          Disabled
                        </span>
                      )}
                    </div>
                    {memory.description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                        {memory.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
                      <span>Created: {new Date(memory.create_at).toLocaleDateString()}</span>
                      {memory.tags?.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer mr-2">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={memory.enabled}
                        onChange={() => handleToggle(memory)}
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button 
                      onClick={() => handleOpenModal(memory)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(memory)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-800">
                {editingMemory ? 'Edit Memory' : 'Create New Memory'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                    placeholder="e.g., User Preferences"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  >
                    <option value="LONG_TERM">LONG_TERM (General facts)</option>
                    <option value="SHORT_TERM">SHORT_TERM (Recent context)</option>
                    <option value="EPISODIC">EPISODIC (Events)</option>
                    <option value="SEMANTIC">SEMANTIC (Concepts)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  placeholder="Optional brief description..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  placeholder="e.g., character, plot, important"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Content <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm h-48 resize-none font-mono"
                  placeholder="Enter the actual memory facts or text..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.content.trim() || isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

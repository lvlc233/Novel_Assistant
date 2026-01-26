"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Trash2, 
  Brain, 
  Calendar,
  Clock
} from 'lucide-react';
import { memoryService } from '@/services/memoryService';
import { MemoryMeta, MemoryCreateRequest } from '@/types/memory';
import { CreateMemoryModal } from '@/components/memory/CreateMemoryModal';
import { SlotInjector } from '@/components/common/SlotInjector';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MemoriesPage() {
  const [memories, setMemories] = useState<MemoryMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const data = await memoryService.getMemories();
      setMemories(data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleCreate = async (data: MemoryCreateRequest) => {
    await memoryService.createMemory(data);
    await fetchMemories();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await memoryService.deleteMemory(id);
      await fetchMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const filteredMemories = memories.filter(m => 
    m.memory_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memory_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
       <SlotInjector slotId="header-breadcrumb">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/home" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <span className="text-text-primary">Memories</span>
          </div>
      </SlotInjector>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Brain className="w-8 h-8 text-accent-primary" />
            Memories
          </h1>
          <p className="text-text-secondary mt-1">Manage global context and agent memories</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Memory
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading memories...</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center py-16 bg-surface-secondary/30 border border-dashed border-border-primary rounded-xl">
          <Brain className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <h3 className="text-lg font-medium text-text-primary">No memories found</h3>
          <p className="text-text-secondary max-w-sm mx-auto mt-2">
            {searchQuery ? 'Try adjusting your search terms.' : 'Create your first memory to give your agent context.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory) => (
            <Link
              key={memory.memory_id}
              href={`/memories/${memory.memory_id}`}
              className="group block bg-surface-primary border border-border-primary rounded-xl p-5 hover:border-accent-primary/50 hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-primary truncate pr-4">{memory.memory_name}</h3>
                    {!memory.enable && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">Disabled</span>
                    )}
                </div>
                <button
                  onClick={(e) => handleDelete(e, memory.memory_id)}
                  className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-text-secondary line-clamp-2 mb-4 h-10">
                {memory.memory_description || 'No description provided.'}
              </p>

              <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-border-primary/50">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(memory.create_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(memory.create_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateMemoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
    </AppLayout>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Brain,
  Trash2
} from 'lucide-react';
import { memoryService } from '@/services/memoryService';
import { MemoryDetail, MemoryType } from '@/types/memory';
import { SlotInjector } from '@/components/common/SlotInjector';
import { AppLayout } from '@/components/layout/AppLayout';
import TiptapEditor from '@/components/editor/TiptapEditor';

export default function MemoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<MemoryType>('short');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const data = await memoryService.getMemoryDetail(id);
        setMemory(data);
        setName(data.memory_name);
        setType(data.memory_type);
        setDescription(data.memory_description || '');
        setContent(data.memory_content || '');
        setIsEnabled(data.enable);
      } catch (error) {
        console.error('Failed to fetch memory:', error);
        // router.push('/memories');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
        fetchMemory();
    }
  }, [id]);

  const handleSave = async () => {
    if (!memory) return;
    
    try {
      setIsSaving(true);
      await memoryService.updateMemory(memory.memory_id, {
        memory_name: name,
        memory_description: description,
        memory_context: content,
        enable: isEnabled
      });
      setIsDirty(false);
      // Refresh local state
      setMemory(prev => prev ? { ...prev, memory_name: name, memory_description: description, memory_content: content, enable: isEnabled } : null);
    } catch (error) {
      console.error('Failed to update memory:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memory || !confirm('Are you sure you want to delete this memory? This action cannot be undone.')) return;
    
    try {
      await memoryService.deleteMemory(memory.memory_id);
      router.push('/memories');
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        </div>
      </AppLayout>
    );
  }

  if (!memory) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Brain className="w-16 h-16 text-text-tertiary" />
          <h2 className="text-xl font-bold text-text-primary">Memory Not Found</h2>
          <Link 
            href="/memories" 
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Return to Memories
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-5xl space-y-6">
       <SlotInjector slotId="header-breadcrumb">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/home" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <Link href="/memories" className="hover:text-text-primary">Memories</Link>
            <span>/</span>
            <span className="text-text-primary">{memory.memory_name}</span>
          </div>
      </SlotInjector>

      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-surface-primary/95 backdrop-blur z-10 py-4 border-b border-border-primary">
        <div className="flex items-center gap-4">
          <Link 
            href="/memories" 
            className="p-2 hover:bg-surface-hover rounded-lg text-text-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                {name}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    type === 'long' 
                        ? 'bg-purple-50 text-purple-600 border-purple-200' 
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                    {type === 'long' ? 'Long Term' : 'Short Term'}
                </span>
            </h1>
            <p className="text-xs text-text-tertiary mt-1">Created at {new Date(memory.create_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Memory"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-border-primary mx-1" />
          <button
            onClick={handleSave}
            disabled={!isDirty && !isSaving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium ${
              isDirty 
                ? 'bg-accent-primary hover:bg-accent-hover text-white shadow-sm' 
                : 'bg-surface-secondary text-text-disabled cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-primary rounded-xl border border-border-primary p-4 shadow-sm">
                 <h2 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Memory Content</h2>
                 <div className="prose max-w-none min-h-[500px]">
                    <TiptapEditor
                        content={content}
                        onChange={(html) => {
                            setContent(html);
                            setIsDirty(true);
                        }}
                        editable={true}
                    />
                 </div>
            </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
            <div className="bg-surface-primary rounded-xl border border-border-primary p-5 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-text-primary mb-4">Settings</h2>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            setIsDirty(true);
                        }}
                        rows={4}
                        className="w-full px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary resize-none"
                    />
                </div>

                 <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-text-secondary">Enabled</span>
                    <button
                        onClick={() => {
                            setIsEnabled(!isEnabled);
                            setIsDirty(true);
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                            isEnabled ? 'bg-accent-primary' : 'bg-surface-secondary border border-border-primary'
                        }`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                            isEnabled ? 'left-7' : 'left-1'
                        }`} />
                    </button>
                </div>
            </div>

            <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
                <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-blue-700">Memory Tip</h3>
                        <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                            Memories help the Agent understand context. 
                            <br/>
                            <strong>Long Term:</strong> Permanent facts and rules.
                            <br/>
                            <strong>Short Term:</strong> Temporary context or recent events.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

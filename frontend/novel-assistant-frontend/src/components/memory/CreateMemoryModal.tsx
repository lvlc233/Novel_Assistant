import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { MemoryCreateRequest, MemoryType } from '@/types/memory';

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemoryCreateRequest) => Promise<void>;
}

export function CreateMemoryModal({ isOpen, onClose, onSubmit }: CreateMemoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<MemoryType>('short');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        memory_name: name,
        memory_type: type,
        memory_description: description,
        memory_context: context
      });
      onClose();
      // Reset form
      setName('');
      setType('short');
      setDescription('');
      setContext('');
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-primary rounded-xl shadow-2xl border border-border-primary overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-lg font-bold text-text-primary">Create New Memory</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Context"
              className="w-full px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="memoryType"
                  value="short"
                  checked={type === 'short'}
                  onChange={() => setType('short')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-text-primary">Short Term</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="memoryType"
                  value="long"
                  checked={type === 'long'}
                  onChange={() => setType('long')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-text-primary">Long Term</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Initial memory content..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all resize-none h-32"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

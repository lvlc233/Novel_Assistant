"use client";
import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import { Work } from '@/types/work';
import { updateWork } from '@/services/workService';
import { logger } from '@/lib/logger';

interface WorkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work;
  onUpdate: (updatedWork: Work) => void;
}

/**
 * 开发者: FrontendAgent(react)
 * 创建时间: 2026-01-25 12:45
 * 描述: 作品设置模态框，用于修改作品基本信息（标题、简介、封面）。
 */
export default function WorkSettingsModal({ isOpen, onClose, work, onUpdate }: WorkSettingsModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    cover: null as File | null,
    coverUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && work) {
      setFormData({
        title: work.title,
        synopsis: work.synopsis || '',
        cover: null,
        coverUrl: work.cover || ''
      });
      setError(null);
    }
  }, [isOpen, work]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        cover: file,
        coverUrl: URL.createObjectURL(file) // Preview
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('作品标题不能为空');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // TODO: Handle real file upload here and get URL
      // For now, we just pass the object URL if it's a new file (which won't persist across reloads in real app)
      // In a real app, upload first -> get URL -> update work
      const coverUrl = formData.cover ? formData.coverUrl : formData.coverUrl;

      const updated = await updateWork({
        user_id: userId,
        work_id: work.id,
        work_name: formData.title,
        work_summary: formData.synopsis,
        work_cover_image_url: coverUrl
      });

      onUpdate(updated);
      onClose();
      logger.info('Updated work:', work.id);
    } catch (err: unknown) {
      logger.error('Failed to update work:', err);
      const message = err instanceof Error ? err.message : '更新失败';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh] border border-stone-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-black" />
            作品设置
          </h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-6">
            {/* Left: Cover */}
            <div className="shrink-0">
               <label className="block text-sm font-bold text-text-primary mb-2">封面</label>
               <div className="
                 w-40 h-56 rounded-lg border-2 border-dashed border-gray-300 
                 flex flex-col items-center justify-center cursor-pointer 
                 hover:border-black hover:bg-gray-50 transition-colors
                 relative group overflow-hidden bg-gray-100
               ">
                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                 {formData.coverUrl ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={formData.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center p-2 text-gray-400">
                     <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                     <span className="text-xs">点击上传</span>
                   </div>
                 )}
                 
                 {/* Hover Overlay */}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                 </div>
               </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">作品名称 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full border border-border-primary rounded-lg px-3 py-2 outline-none focus:border-black transition-colors"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="请输入作品名称"
                  />
               </div>

               <div className="flex-1 flex flex-col h-full">
                  <label className="block text-sm font-bold text-text-primary mb-1">作品简介</label>
                  <textarea 
                    className="w-full h-32 border border-border-primary rounded-lg px-3 py-2 outline-none focus:border-black transition-colors resize-none"
                    value={formData.synopsis}
                    onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                    placeholder="请输入作品简介..."
                  />
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3 shrink-0">
          <button 
             onClick={onClose}
             className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
             disabled={isSaving}
          >
             取消
          </button>
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isSaving ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 保存中...
               </>
             ) : (
               <>
                 <Save className="w-4 h-4" />
                 保存修改
               </>
             )}
          </button>
        </div>
      </div>
    </div>
  );
}

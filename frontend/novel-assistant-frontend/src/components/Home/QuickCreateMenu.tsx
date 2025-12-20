import React from 'react';
import { Book, FilePlus, Upload } from 'lucide-react';
import Button from '../base/Button';

interface QuickCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'blank' | 'template' | 'import') => void;
}
// 快速创建菜单组件，用于用户选择新建空白作品、使用模板或导入作品
const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6 text-gray-800">新建作品</h2>
        
        <div className="space-y-3">
          <button 
            onClick={() => onSelect('blank')}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <FilePlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">空白创作</div>
              <div className="text-sm text-gray-500">从零开始创作你的故事</div>
            </div>
          </button>

          <button 
            onClick={() => onSelect('template')}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Book className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">使用模板</div>
              <div className="text-sm text-gray-500">基于经典结构快速开始</div>
            </div>
          </button>

          <button 
            onClick={() => onSelect('import')}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">导入文档</div>
              <div className="text-sm text-gray-500">支持 Word, TXT, Markdown</div>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>取消</Button>
        </div>
      </div>
    </div>
  );
};

export default QuickCreateMenu;

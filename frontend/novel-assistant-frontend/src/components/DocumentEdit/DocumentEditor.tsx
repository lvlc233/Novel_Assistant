"use client";

import { useState, useRef } from 'react';
import { Save } from 'lucide-react';
import TableOfContents from '../Table/TableOfContents';
import '../Table/table-of-contents.css';

interface DocumentEditorProps {
  isChatExpanded: boolean;
}

export default function DocumentEditor({ isChatExpanded }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('未命名文档');
  const [isSaved, setIsSaved] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    // 模拟保存功能
    console.log('保存文档:', { title, content });
    setIsSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };



  return (
    <div 
      className={`document-editor ${isChatExpanded ? 'chat-expanded' : 'chat-collapsed'}`}
      onKeyDown={handleKeyDown}
    >
      {/* 目录组件 */}
      <TableOfContents />
      
      {/* 编辑区域 */}
      <div className="document-content">
        <div className="document-header-container">
          {/* 左边版本号区域 */}
          <div className="header-left-spacer">
            <span className="version-info">
              v1.0.0
            </span>
          </div>
          
          {/* 中间标题区域 */}
          <div className="document-title-wrapper">
            <div className="document-title">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="document-title-input"
                placeholder="输入小说标题..."
              />
            </div>
          </div>
          
          {/* 右边状态栏 */}
          <div className="status-right">
            <span className="word-count">
              字数: {content.length}
            </span>
            <span className="line-count">
              行数: {content.split('\n').length}
            </span>
            <span className={`save-status ${isSaved ? 'saved' : 'unsaved'}`}>
              {isSaved ? '已保存' : '未保存'}
            </span>
          </div>
        </div>
        
        {/* 文档内容 */}
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          className="document-textarea"
          placeholder="开始书写您的小说..."
          spellCheck={false}
        />
        
        {/* 悬浮保存按钮 - 右下角 */}
        <button
          onClick={handleSave}
          className="floating-save-button"
          aria-label="保存文档"
        >
          <Save size={16} />
          保存
        </button>
      </div>
    </div>
  );
}
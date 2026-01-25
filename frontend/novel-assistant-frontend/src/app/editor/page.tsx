"use client";
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentEditor from '@/components/editor/DocumentEditor';
import AIAssistant from '@/components/editor/AIAssistant';

// Wrap content in Suspense for useSearchParams
function EditorContent() {
  const searchParams = useSearchParams();
  const novelId = searchParams.get('novelId');
  const initialChapterId = searchParams.get('initialChapterId');
  
  const [isAiExpanded, setIsAiExpanded] = useState(true);

  return (
    <div className="flex w-full h-screen bg-white overflow-hidden relative">
        {/* Left: AI Assistant Sidebar */}
        <div 
            className={`
                h-full flex-shrink-0 z-20 
                transition-all duration-300 ease-in-out overflow-hidden
                ${isAiExpanded ? 'w-[400px]' : 'w-0'}
            `}
        >
            <div className="w-[400px] h-full">
                <AIAssistant isExpanded={isAiExpanded} onToggle={() => setIsAiExpanded(!isAiExpanded)} />
            </div>
        </div>
        
        {/* Floating Toggle Button (When AI is collapsed) */}
        {!isAiExpanded && (
             <div className="absolute left-6 bottom-8 z-50">
                 <button 
                    onClick={() => setIsAiExpanded(true)}
                    className="w-12 h-12 bg-black rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                    title="打开助手"
                 >
                    {/* Re-import MessageSquare if needed, or use inline svg */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                 </button>
             </div>
        )}

        {/* Right: Main Editor Area */}
        <div className="flex-1 h-full relative z-10 min-w-0">
            <DocumentEditor 
                isChatExpanded={isAiExpanded}
                novelId={novelId}
                initialChapterId={initialChapterId}
            />
        </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}

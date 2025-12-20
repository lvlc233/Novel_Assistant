
// 仪表盘
import React from 'react';

interface SystemIntroduction {
  // onNavigateToEditor: () => void;
}
// 系统介绍栏组件，展示系统功能介绍
const SystemIntroduction: React.FC<SystemIntroduction> = () => {

  return (
      <div className="w-full flex flex-col items-center justify-center mt-4 mb-8">
        {/* 分割线 */}
        <div className="w-full max-w-3xl border-t-2 border-dashed border-border-primary/60 mb-8"></div>        
        
        {/* Document 标题 */}
        <div>
            <h2 className="text-4xl font-serif text-text-primary tracking-wider font-medium opacity-90">Document</h2>
        </div>
      </div>
  );
};

export default SystemIntroduction;

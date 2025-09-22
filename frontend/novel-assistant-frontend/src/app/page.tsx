

"use client";

import { useState } from 'react';
import { CopilotSidebar, useChatContext } from '@copilotkit/react-ui';
import DocumentEditor from '@/components/DocumentEdit/DocumentEditor';
import MailIcon from '@/components/MailIcon';
import CustomChatButton from '@/components/Sideber/Button/Button';
import CustomHeader from '@/components/Sideber/Header/Header';
import CustomInput from '@/components/Sideber/Input/Input';
import { CopilotKit } from '@copilotkit/react-core';


/* ② 一次性拦截：放在 CopilotKit 渲染之前即可 */

export default function HomePage() {

  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  // 处理侧边栏收起/展开逻辑
  const handleToggleSidebar = () => {
    setIsCopilotOpen(!isCopilotOpen);
  };

      
  return (
    <div className="min-h-screen bg-gray-100">
      {/* CopilotSidebar - 左侧AI助手侧边栏 */}
      <CopilotSidebar
        defaultOpen={isCopilotOpen}
        clickOutsideToClose={false}
        labels={{
          title: "AI 写作助手",
          initial: "你好！我是你的AI写作助手，有什么可以帮助你的吗？",
          placeholder: "输入你的问题...",
        }}
        onSetOpen={setIsCopilotOpen}
        Button={CustomChatButton}
        Header={CustomHeader}   
        Input={CustomInput}  
      />
   
  
    
      {/* 文档编辑器 */}
      <DocumentEditor isChatExpanded={isCopilotOpen} />
      {/* 邮件图标 - 悬浮在页面右上角 */}
      <MailIcon onClick={() => console.log('邮件图标被点击')} />
    </div>
  );
}




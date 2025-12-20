import React from 'react';
import { InputProps } from '@copilotkit/react-ui';
import SendButton from './SendButton';
import SearchToggle from './SearchToggle';
import NewChatButton from './NewChatButton';
import ChatTextarea from './ChatTextarea';
export default function CustomInput({ inProgress, onSend }: InputProps) {
  const [text, setText] = React.useState('');
  const [searchOn, setSearchOn] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!text.trim() || inProgress) return;
    onSend(text);
    setText('');
  };

  // Enter 发送，Shift+Enter 换行
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="customInputRect">

        <ChatTextarea
            ref={textareaRef}
            value={text}
            onChange={setText}
            onKeyDown={onKeyDown}
            disabled={inProgress}
            placeholder="输入 … Shift+Enter 换行"
        />
        <NewChatButton onClick={() => console.log('新建会话')} />

        <SearchToggle on={searchOn} onToggle={() => setSearchOn((v) => !v)} />

        {/* 右下角发送 */}
        <SendButton onClick={handleSubmit} disabled={inProgress} />
    </div>
  );
}
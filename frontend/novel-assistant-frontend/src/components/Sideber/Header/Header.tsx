import React from 'react';
import { useChatContext } from '@copilotkit/react-ui';
import { FiMenu, FiSettings, FiArrowLeft } from 'react-icons/fi';

export default function CustomHeader() {
  const { open, setOpen } = useChatContext();

  return (
    <div className="copilotKitHeader">
      {/* 左侧：菜单 + 设置 */}
      <div className="flex items-center gap-3">
        <button
          aria-label="历史记录"
          onClick={() => console.log('打开历史')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <FiMenu className="w-5 h-5 text-gray-700" />
        </button>

        <button
          aria-label="设置"
          onClick={() => console.log('打开设置')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <FiSettings className="w-5 h-5 text-gray-700" />
        </button>
      </div>
        {/* 中间标题 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                      text-gray-800 font-semibold text-base select-none">
        与我共创
      </div>
      {/* 右侧：箭头关闭 */}
      <button
        aria-label="关闭聊天"
        onClick={() => setOpen(false)}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <FiArrowLeft className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
// CopilotChatButton.tsx
import React from "react";
import { FiMessageCircle } from "react-icons/fi";          // 选一个喜欢的气泡图标
import { ButtonProps, useChatContext } from "@copilotkit/react-ui";


function CopilotChatButton({}: ButtonProps) {
  const { open, setOpen } = useChatContext();
  return (
    <div className="copilotKitButtonWrapper">
        <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close Chat" : "Open Chat"}
            className={`
                flex items-center justify-center
                w-14 h-14 rounded-full          /* 圆形 */
                bg-black                        /* 黑色背景 */
                text-white                      /* 白色图标 */
                shadow-lg hover:shadow-xl       /* 阴影 + 悬停加深 */
                transform
                hover:scale-110 active:scale-95 /* 悬停放大 / 点击缩小 */
                transition-all duration-200 ease-in-out
                focus:outline-none
            `}
            >
            <FiMessageCircle className="w-6 h-6" />
        </button>
    </div>
  );
}

export default CopilotChatButton;
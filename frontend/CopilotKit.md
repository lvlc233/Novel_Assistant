# **CopilotKit**

官网https://www.copilotkit.ai/

仪表盘:https://cloud.copilotkit.ai/dashboard

前端组件,用于AI交互

- 脚手架
    
    npx copilotkit@latest init
    
- 包的安装
    
    ```jsx
    //核心包
    npm install @copilotkit/react-ui @copilotkit/react-core @copilotkit/runtime
    ```
    
- 本地化
    
    CopilotKit **可以纯本地运行**，也**只把 UI 组件当“壳”用**
    
- MCP
    
    https://docs.copilotkit.ai/direct-to-llm/guides/vibe-coding-mcp
    
- 入口
    
    ```jsx
    export default function RootLayout({ children }: { children: ReactNode }) {
      return (
        <html lang="en">
          <body>
            {/* Use the public api key you got from Copilot Cloud  */} // [!code highlight:4]
            <CopilotKit publicApiKey="<your-copilot-cloud-public-api-key>"> 
              {children}
            </CopilotKit>
          </body>
        </html>
      );
    }
    ```
    
- 组件
    - 默认样式
        
        ```jsx
        import "@copilotkit/react-ui/styles.css";
        ```
        
    - useCopilotChat
        
        事件钩子
        
        ```jsx
          const {
            visibleMessages,
            appendMessage,
            setMessages,
            deleteMessage,
            reloadMessages,
            stopGeneration,
            isLoading,
          } = useCopilotChat();
        ```
        
    - CopilotSidebar
    - CopilotChat
    - CopilotPopup
- 自定义 Copilot UI 组件的颜色和结构。
    - 方案[Introduction to CopilotKit](https://docs.copilotkit.ai/direct-to-llm/guides/custom-look-and-feel/customize-built-in-ui-components)
        - CSS变量
            - CopilotKitCSSProperties是组件属性样式配置集合
            
            ```jsx
            
            import { CopilotKitCSSProperties} from "@copilotkit/react-ui";
            <div style={
                    {
                      "--copilot-kit-background-color": "#44444",
                    } as CopilotKitCSSProperties
                  }>
                <组件/>
            </div>
            ```
            
        - 自定义CSS
            
            ```jsx
            //在全局/其他的CSS文件中定义
            .copilotKitButton {
              border-radius: 0;
            }
            
            .copilotKitMessages {
              padding: 2rem;
            }
            
            .copilotKitUserMessage {
              background: #007AFF;
            }
            //.类选择器
            ```
            
        - 自定义字体
            
            使用的各种 CSS 类中的 `fontFamily` 属性来自定义字体。
            
            ```jsx
            .copilotKitMessages {
            	 //字体
              font-family: "Arial, sans-serif";
            }
            
            .copilotKitInput {
              font-family: "Arial, sans-serif";
            }
            ```
            
        - 自定义图标
            - 通过属性Icon定义
                
                ```jsx
                <CopilotChat
                  icons={{
                    // Use your own icons here – any React nodes
                    openIcon: <YourOpenIconComponent />,
                    closeIcon: <YourCloseIconComponent />,
                  }}
                />
                ```
                
        - 自定义标签
            - 通过属性labels传入
                
                ```jsx
                <CopilotChat
                  labels={{
                    initial: "Hello! How can I help you today?",
                    title: "My Copilot",
                    placeholder: "Ask me anything!",
                    stopGenerating: "Stop",
                    regenerateResponse: "Regenerate",
                  }} 
                />
                ```
                
        - 子组件
            - https://docs.copilotkit.ai/direct-to-llm/guides/custom-look-and-feel/bring-your-own-components
        - **完全无头 UI**
            
            **只给逻辑、零外观**的组件库
            这个是最基础的组件库,可以使用这个来完成更加高自定义的组件
            从 0 拼出**任何外观**的 Copilot 界面，而不用重写 WebSocket、重试、加载态等脏活。
            
        - md文件
- 行为
    - 钩子函数
        
        https://docs.copilotkit.ai/direct-to-llm/guides/frontend-actions
        
        useCopilotAction
        
    - 用AI在ui中进行动态的组件渲染
        
        https://docs.copilotkit.ai/direct-to-llm/guides/generative-ui?gen-ui-type=renderAndWaitForResponse+%28HITL%29
        
- 审核
    - https://docs.copilotkit.ai/direct-to-llm/guides/guardrails
- 持久化到游览器→记录
    
    https://docs.copilotkit.ai/direct-to-llm/guides/messages-localstorage
    
- AI感知文本编辑
    
    https://docs.copilotkit.ai/direct-to-llm/guides/copilot-textarea
    
- 前后端状态共享
    - https://docs.copilotkit.ai/shared-state
- 用户状态交互(状态机)
    
    https://docs.copilotkit.ai/direct-to-llm/cookbook/state-machine
    
- 人机交互
    
    https://docs.copilotkit.ai/direct-to-llm/guides/human-in-the-loop
    
- 建议生成
    
    https://docs.copilotkit.ai/direct-to-llm/guides/copilot-suggestions

- 完全无头UI
    让我们可以完全自定义Copilot的UI组件，而不需要使用CopilotKit的默认组件。
    https://docs.copilotkit.ai/custom-look-and-feel/headless-ui
- AG-UI
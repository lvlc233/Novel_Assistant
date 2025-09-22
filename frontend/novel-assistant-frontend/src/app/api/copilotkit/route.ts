import {
  CopilotRuntime,
  LangChainAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest } from "next/server";
 
// 1. 配置LangChain适配器连接到本地LangGraph Agent
const serviceAdapter = new LangChainAdapter({
  chainFn: async ({ messages, tools }) => {
    // 1. 首先创建一个thread
    const threadResponse = await fetch("http://localhost:8123/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ "messages": [{ "role": "user", "content": "你好" }] }),
    });
    
    
    
    return threadResponse.json();
  },
});

// 2. 创建CopilotRuntime实例，使用LangGraph适配器
const runtime = new CopilotRuntime({});
 
// 4. 构建Next.js API路由处理CopilotKit运行时请求
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime, 
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
 
  return handleRequest(req);
};
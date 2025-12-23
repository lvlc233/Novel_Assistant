/**
 * 全局配置中心
 * 用于统一管理后端 API 地址、WebSocket 连接等配置
 */

// 小说服务基础地址
const NOVEL_SERVICE_URL = "http://localhost:8426";

export const config = {
  // 小说配置
  novel: {
    baseUrl: NOVEL_SERVICE_URL,
    // 小说 API 基础路径
    apiBaseUrl: `${NOVEL_SERVICE_URL}/novel`,
    // 小说 Agent 相关配置
    agents: {
      baseUrl: NOVEL_SERVICE_URL,
      // CopilotKit 端点
      copilotEndpoint: `${NOVEL_SERVICE_URL}/copilotkit`,
    },
  },
};

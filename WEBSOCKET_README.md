# WebSocket连接使用指南

本文档详细介绍如何在Novel Assistant项目中使用WebSocket功能进行前后端实时通信。

## 概述

本项目使用WebSocket协议实现前后端实时双向通信，前端可以通过WebSocket与后端的AI助手进行实时对话。后端基于LangChain 1.0的`create_agent`构建了专门的聊天助手Agent。

## 技术架构

### 后端技术栈
- **FastAPI**: WebSocket端点和HTTP API
- **LangChain 1.0**: 使用`create_agent`创建AI助手
- **chat_helper_graph**: 专门用于小说创作的聊天助手Agent
- **ConnectionManager**: WebSocket连接和会话管理

### 前端技术栈
- **React**: UI组件库
- **TypeScript**: 类型安全的开发
- **WebSocket API**: 原生WebSocket客户端
- **Custom Hooks**: `useWebSocket`钩子简化使用

## 快速开始

### 1. 启动后端服务

```bash
# 在项目根目录下
cd Novel_Assistant/Novel_Assistant

# 安装依赖
uv pip install -e .

# 启动FastAPI服务
python src/start_api.py
```

后端服务将在 `http://localhost:8000` 启动，WebSocket端点为 `ws://localhost:8000/chat/api/v1/ws/chat/{session_id}`

### 2. 启动前端服务

```bash
# 在前端目录下
cd frontend/novel-assistant-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 3. 访问测试页面

打开浏览器访问 `http://localhost:3000/websocket-test` 即可看到WebSocket测试界面。

## WebSocket API文档

### 连接端点

```
ws://localhost:8000/chat/api/v1/ws/chat/{session_id}
```

其中 `{session_id}` 是会话的唯一标识符，可以是任意字符串。

### 消息格式

#### 客户端发送的消息

```typescript
// 发送聊天消息
{
  "type": "message",
  "content": "用户输入的消息内容",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 发送心跳（保持连接）
{
  "type": "ping",
  "content": "",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 清空历史消息
{
  "type": "clear_history",
  "content": "",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 服务端回复的消息

```typescript
// 连接确认
{
  "type": "connection",
  "content": "连接成功",
  "session_id": "session-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 心跳响应
{
  "type": "pong",
  "content": "",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 开始处理消息
{
  "type": "processing_start",
  "content": "正在处理您的消息...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 流式响应（可能收到多个）
{
  "type": "stream",
  "content": "响应内容片段",
  "chunk_index": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 响应完成
{
  "type": "complete",
  "content": "",
  "full_response": "完整的响应内容",
  "chunk_count": 5,
  "timestamp": "2024-01-01T12:00:00.000Z"
}

// 错误消息
{
  "type": "error",
  "content": "错误描述",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### HTTP API端点

除了WebSocket，还提供以下HTTP端点：

#### 获取历史消息
```
GET /chat/api/v1/ws/history/{session_id}
```

#### 清空历史消息
```
DELETE /chat/api/v1/ws/history/{session_id}
```

#### 获取连接统计
```
GET /chat/api/v1/ws/stats
```

#### 创建新会话
```
POST /chat/api/v1/ws/session
```

#### WebSocket健康检查
```
GET /chat/api/v1/ws/health
```

## 前端使用示例

### 基础使用

```tsx
import React from 'react';
import { ChatInterface } from '@/components/WebSocketChat';

function MyApp() {
  return (
    <div>
      <h1>我的应用</h1>
      <ChatInterface
        sessionId="my-session-123"
        height="500px"
        placeholder="输入消息..."
      />
    </div>
  );
}
```

### 自定义使用

```tsx
import React, { useState } from 'react';
import { useWebSocket, generateSessionId } from '@/components/WebSocketChat';

function CustomChat() {
  const [sessionId] = useState(() => generateSessionId());
  const { state, sendMessage, clearHistory } = useWebSocket(sessionId, {
    autoConnect: true,
    reconnect: true,
    onConnect: () => console.log('Connected!'),
    onMessage: (message) => console.log('Message:', message)
  });

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  return (
    <div>
      <div>连接状态: {state.isConnected ? '已连接' : '未连接'}</div>
      <div>消息数量: {state.messages.length}</div>
      {/* 自定义UI */}
    </div>
  );
}
```

## 测试WebSocket连接

### 运行测试脚本

```bash
# 确保后端服务正在运行
python src/tests/test_websocket.py
```

测试脚本将：
1. 测试所有HTTP端点
2. 建立WebSocket连接
3. 发送多条测试消息
4. 验证流式响应
5. 测试心跳机制

### 手动测试

1. 启动后端服务：`python src/start_api.py`
2. 启动前端服务：`npm run dev`
3. 访问：`http://localhost:3000/websocket-test`
4. 在聊天界面中输入消息进行测试

## 故障排除

### 连接失败

1. **检查后端服务是否启动**
   ```bash
   curl http://localhost:8000/chat/api/v1/health
   ```

2. **检查端口是否被占用**
   ```bash
   netstat -an | grep 8000
   ```

3. **检查防火墙设置**
   - 确保8000端口对外开放
   - WebSocket需要长连接支持

### 消息发送失败

1. **检查消息格式**
   - 必须是有效的JSON格式
   - 必须包含`type`和`content`字段

2. **检查连接状态**
   - 确保WebSocket已连接
   - 查看控制台中的连接状态

3. **检查后端日志**
   - 查看是否有错误信息
   - 检查是否有异常抛出

### 响应延迟

1. **检查网络状况**
   - 网络延迟会影响响应时间
   - 考虑使用CDN或就近部署

2. **检查AI模型响应**
   - 模型处理可能需要时间
   - 流式响应会逐步返回结果

3. **优化消息长度**
   - 过长的消息会增加处理时间
   - 过长的历史会影响性能

## 性能优化建议

### 后端优化

1. **会话管理**
   - 限制每个会话的历史消息数量（当前限制20条）
   - 定期清理不活跃的会话

2. **连接管理**
   - 使用连接池管理WebSocket连接
   - 实现连接限速和防护机制

3. **错误处理**
   - 完善的异常捕获和处理
   - 友好的错误信息返回

### 前端优化

1. **消息缓存**
   - 本地缓存历史消息
   - 实现消息分页加载

2. **连接优化**
   - 自动重连机制
   - 心跳保活机制

3. **UI优化**
   - 虚拟滚动处理大量消息
   - 防抖处理用户输入

## 安全考虑

1. **输入验证**
   - 验证所有输入数据
   - 防止注入攻击

2. **连接认证**
   - 实现用户认证机制
   - 限制未授权访问

3. **数据加密**
   - 使用WSS协议（WebSocket over TLS）
   - 敏感数据加密传输

4. **速率限制**
   - 限制消息发送频率
   - 防止滥用服务

## 扩展功能

### 计划中的功能

1. **文件上传支持**
   - 支持上传文档进行AI分析
   - 图片识别和处理

2. **多模态对话**
   - 支持语音输入输出
   - 图像理解和生成

3. **协作功能**
   - 多人实时协作
   - 共享编辑和评论

4. **高级分析**
   - 对话质量分析
   - 用户行为统计

## 更新日志

### v1.0.0 (当前版本)
- ✅ WebSocket基础连接功能
- ✅ 聊天助手Agent集成
- ✅ 流式响应支持
- ✅ 会话管理和历史记录
- ✅ 自动重连和心跳机制
- ✅ TypeScript类型支持
- ✅ 完整的测试工具

## 贡献指南

欢迎提交Issue和Pull Request来改进WebSocket功能。

### 开发规范

1. 使用TypeScript进行类型安全的开发
2. 遵循现有的代码风格和命名规范
3. 为新功能添加完整的测试
4. 更新相关文档和README

### 提交规范

- feat: 新功能
- fix: 修复Bug
- docs: 文档更新
- style: 代码格式
- refactor: 代码重构
- test: 测试相关
- chore: 构建和辅助工具

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交GitHub Issue
- 查看项目文档
- 参考示例代码

---

**注意**: 本项目使用SiliconFlow API提供的AI模型，确保你有有效的API密钥配置。
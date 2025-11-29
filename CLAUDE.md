# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在操作本仓库代码时提供指引。
接下来Claude的所有回复必须使用中文回答,即使压缩记忆后,也必须将该指令放在最重要的位置

## 项目概述

Novel_Assistant 是一款面向小说创作的多智能体 AI 辅助系统，采用 LangGraph/LangChain 进行智能体编排，FastAPI 构建后端，Next.js/React 搭建前端。

## 架构

### 多智能体系统
- **Facade Agent**：主交互界面，负责通信与任务分发
- **Memory Agent**：管理三级记忆架构（短期/工作/长期）
- **Knowledge Agent**：从小説提取知识并构建知识图谱

### 技术栈
- **后端**：Python 3.11+、FastAPI、LangGraph、Neo4j（图库）、SQLModel
- **前端**：Next.js 15.3.2、TypeScript、Tailwind CSS、HeroUI、CopilotKit
- **包管理**：UV（Python）、npm/pnpm（Node.js）

## 核心命令

### 后端开发
```bash
# 安装依赖（在 Novel_Assistant/Novel_Assistant/ 执行）
uv pip install -e .

# 启动 LangGraph 智能体开发服务
langgraph dev --port 8123

# 运行 FastAPI 服务
python src/start_api.py

# 运行主程序
python src/main.py

# 代码检查与格式化
ruff check . && ruff format .

# 类型检查
mypy .
```

### 前端开发
```bash
# 安装依赖（在 frontend/novel-assistant-frontend/ 执行）
npm install

# 启动开发服务（UI + 智能体）
npm run dev

# 仅启动 UI 服务
npm run dev:ui

# 仅启动智能体服务
npm run dev:agent

# 生产构建
npm run build

# 代码检查
npm run lint
```

### 测试
```bash
# 运行 Python 测试（pytest 配置见 pyproject.toml）
pytest

# 运行指定测试文件
pytest test/core/agent/test_nodes.py
```

## 关键配置

### 后端
- `src/.config/model_config.yaml`：LLM 配置（SiliconFlow API 密钥）
- `src/.config/graph_config.yaml`：智能体节点路由与业务逻辑
- `langgraph.json`：LangGraph 智能体定义与依赖
- `pyproject.toml`：Python 依赖与构建设置

### 前端
- `package.json`：Node.js 依赖与脚本
- `agent/langgraph.json`：前端智能体配置
- `agent/.env`：前端智能体 OpenAI API 密钥

## 模型加载

通过 `load_chat_model()` 工具函数从 YAML 加载模型：

```python
from common.utils import load_chat_model

# 按 key 加载 model_config.yaml 中的模型
model = load_chat_model("chat")  # 或 "default"、"atom_build" 等
```

## 智能体开发

### Knowledge Agent 图（6 节点流水线）
1. **Chunk Node**：文档 → 分块
2. **Attention Node**：注意力分配与信息过滤
3. **Atomic Entity Node**：提取原子实体
4. **Dependency Entity Node**：提取实体关系
5. **Completion Node**：合并至知识图谱
6. **Cypher Node**：生成 Neo4j Cypher 查询

### 状态管理
- `Allocation`：任务分配状态
- `KDBuildState`：知识构建状态
- `ChatHelperState`：对话交互状态

## 记忆系统

三级架构：
1. **短期记忆**：完整对话上下文
2. **工作记忆**：经压缩的短期上下文
3. **长期记忆**：持久化用户偏好与关键信息

## 数据库

- **Neo4j**：存储知识图谱（从小説提取）
- **SQLModel**：通用数据持久层

## 重要说明

- 项目使用 SiliconFlow API 提供的 LLM 模型（配置见 model_config.yaml）
- 前后端智能体分端口运行（UI: 3000，Agent: 8123）
- 知识提取当前专注於小説转图谱场景
- 记忆系统跨三智能体协同以实现上下文保留
- 日志采用 Loguru，含自定义处理器（NodeLogHandler、LLMLogHandler）
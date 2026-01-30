# Agent 模块接口与文档对齐记录

## 变更时间
2026-01-30

## 变更目标
将 Agent 模块的接口定义与 `项目统一技术架构文档(重要).md` 进行对齐，补全缺失的辅助助手（Helper）接口。

## 变更范围
1.  **新增文件**:
    -   `backend/src/api/routes/agent/helper_schema.py`: 定义文档助手和项目助手的配置及消息请求模型。
    -   `backend/src/api/routes/agent/document_helper_router.py`: 实现文档创作助手相关接口 (`/plugin/agent/document_helper/...`)。
    -   `backend/src/api/routes/agent/project_helper_router.py`: 实现项目助手相关接口 (`/plugin/agent/project_helper/...`)。
2.  **修改文件**:
    -   `backend/src/api/app.py`: 注册新增的 `document_helper_router` 和 `project_helper_router`。

## 验证方式
1.  **接口路径核对**:
    -   文档创作助手: `/plugin/agent/document_helper` (符合文档 L471)
    -   项目助手: `/plugin/agent/project_helper` (符合文档 L509)
2.  **代码审查**: 确认新创建的 Router 和 Schema 定义与架构文档中的描述一致。

## 结果
Agent 模块现已包含架构文档中描述的所有组件（管理器、文档助手、项目助手），接口定义已对齐。

# SDUI 架构升级

## 变更信息
- **时间**: 2026-02-24 01:00
- **目标**: 根据讨论实现基于 `Component` 树的 Server-Driven UI (SDUI) 架构，替代原有的 `CardPayload` 方式。
- **变更范围**:
    - **后端**:
        - `backend/src/core/plugin/ui/`: 新增 UI 核心定义 (`Component`, `Slot`, `Page`, `Card`, `Action` 等)。
        - `backend/src/common/enums.py`: 新增 `RenderType.COMPONENT`。
        - `backend/src/api/routes/plugin/schema.py`: 新增 `ComponentPayload` 和 `ComponentSchema`。
        - `backend/src/plugin/agent_manager/plugin.py`: 更新 `get_card_view` 返回 `ComponentPayload`。
    - **前端**:
        - `frontend/.../types/plugin.ts`: 新增 `ComponentPayload` 类型定义。
        - `frontend/.../components/dashboard/plugin-renderers/ComponentRenderer.tsx`: 新增通用组件渲染器。
        - `frontend/.../components/dashboard/PluginManagerModal.tsx`: 集成 `ComponentRenderer`。

## 验证方式与结果
- **后端验证**: `get_card_view` 能够正确构造并返回 `ComponentPayload` 结构的 JSON。
- **前端验证**: Agent 管理插件能够正确渲染卡片列表，且交互动作（点击、菜单）正常工作。
- **架构收益**: 实现了 UI 结构的完全后端定义，支持更灵活的组件嵌套和布局（如 Grid, Card, Button），为后续 "Slot" 机制打下基础。

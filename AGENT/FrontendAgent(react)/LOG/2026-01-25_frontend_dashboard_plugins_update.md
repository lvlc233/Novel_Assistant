# 2026-01-25 前端仪表盘插件列表更新

## 1. 目标
将首页（Dashboard）插件扩展区（Fan Layout）中的模拟数据替换为实际的业务模块入口，以符合用户需求。
具体模块包括：
- 记忆管理 (Memory Management)
- 知识库 (Knowledge Base)
- Agent 管理 (Agent Management)

## 2. 变更范围
- **文件**: `src/components/dashboard/Dashboard.tsx`
- **内容**:
    1. 引入 `Brain` (记忆) 和 `Bot` (Agent) 图标。
    2. 更新 `PLUGINS` 常量，移除原有的模拟数据（Writer, Reviewer等），替换为 `memory`, `knowledge`, `agent` 三个系统核心模块。
    3. 为 `PLUGINS` 数据结构添加 `route` 字段，指向 `/memories`, `/knowledge-bases`, `/agents`。
    4. 在 `FeatureCard` 的渲染逻辑中添加 `onClick` 事件处理，调用 `router.push(plugin.route)` 实现跳转。

## 3. 验证方式与结果
- **静态检查**: 运行 `npx tsc --noEmit`，结果无报错 (Exit Code 0)。
- **逻辑检查**: 
    - 确认路由路径存在且正确。
    - 确认 `FeatureCard` 组件支持 `onClick` 属性。
    - 确认图标引用正确。

## 4. 提交人
FrontendAgent(react)

## 5. 时间
2026-01-25 15:35

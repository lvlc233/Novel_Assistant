# 2026-01-25 前端仪表盘样式修复

## 1. 目标
1. 移除首页插件扩展区中的“添加插件”按钮，只保留三个核心业务卡片。
2. 修复插件卡片文字不可见的问题（原因为白底白字）。

## 2. 变更范围
- **文件**: `src/components/dashboard/Dashboard.tsx`
- **内容**:
    1. 移除 `PLUGINS` 常量中记忆和知识库的 `text-white` 类，并将背景统一改为 `bg-surface-white`，以匹配其他卡片并确保文字（默认深色）可见。
    2. 在渲染逻辑中移除“添加插件”按钮的 JSX 代码块。
- **文件**: `src/components/dashboard/PluginManagerModal.tsx`
- **内容**:
    1. 修复 TypeScript 类型错误：`AgentMeta` 类型中没有 `agent_type` 字段，改为展示 `create_at`。

## 3. 验证方式与结果
- **静态检查**: 运行 `npx tsc --noEmit`，结果无报错 (Exit Code 0)。
- **视觉检查**: 确认卡片背景统一为白色，文字颜色恢复默认（深色），且“添加插件”按钮已消失。

## 4. 提交人
FrontendAgent(react)

## 5. 时间
2026-01-25 16:00

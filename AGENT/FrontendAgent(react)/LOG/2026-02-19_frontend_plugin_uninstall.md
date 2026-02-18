## 时间
2026-02-19 01:39

## 目标
在插件市场与插件管理页增加插件移除能力。

## 变更范围
- frontend/novel-assistant-frontend/src/components/dashboard/Dashboard.tsx
- frontend/novel-assistant-frontend/src/services/pluginService.ts

## 验证方式与结果
- npm run lint（未通过：仓库内既有 lint 报错，包含 hooks、unused、no-explicit-any 等）

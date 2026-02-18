## 时间
2026-02-18 20:20

## 目标
增加插件市场注册状态与版本差异展示，支持加入/更新按钮。

## 变更范围
- frontend/novel-assistant-frontend/src/components/dashboard/Dashboard.tsx
- frontend/novel-assistant-frontend/src/services/pluginService.ts

## 验证方式与结果
- npm run lint（未通过：仓库内既有 lint 报错，含 hooks 规则、unused、no-explicit-any 等）

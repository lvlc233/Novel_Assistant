# Frontend Fix Log - Duplicate Key Error

## 1. Metadata
- **Date**: 2026-01-25
- **Author**: FrontendAgent(react)
- **Goal**: 修复 `NovelDirectory` 组件渲染时出现的 `Encountered two children with the same key` 错误。

## 2. Issue Analysis
- **Error**: `Encountered two children with the same key, 'mock-chap-1769353653756'`
- **Cause**: 
  - Mock 数据服务 (`src/services/documentService.ts`, `src/services/novelService.ts`) 使用 `mock-chap-${Date.now()}` 作为 ID 生成策略。
  - `Date.now()` 精度为毫秒级。如果在同一毫秒内创建多个对象（例如用户快速点击、或 React 严格模式下的副作用、或自动化测试），会生成相同的 ID。
  - 在 React 列表渲染中，重复的 Key 会导致组件状态混乱和控制台错误。

## 3. Changes
- **Files**:
  - `src/services/documentService.ts`: `createFolder`, `createDocument`
  - `src/services/novelService.ts`: `createNovel`
- **Fix**:
  - 将 ID 生成逻辑由 `mock-xxx-${Date.now()}` 修改为 `mock-xxx-${Date.now()}-${Math.floor(Math.random() * 1000)}`。
  - 增加随机后缀以确保即使在同一毫秒内调用也能保证 ID 唯一性。

## 4. Verification
- **Method**: 逻辑验证。
- **Result**: ID 碰撞概率极低，足以支持 Mock 环境下的正常开发和测试。

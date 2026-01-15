---
name: FrontendAgent(react)的记忆
description: |
    这里是FrontendAgent(react)Agent的操作记录。在项目进行的时候，FrontendAgent(react)要根据项目的需求和进度，更新自己的操作记录。
    所有的操作必须记录在操作记录中。并且不可以覆盖之前的操作记录。必须使用追加的信息进行记录。
    [FrontendAgent(react)必读(选最新若干项读)和更新]
author: "lxz"
state: OK
created: 2026-01-01
path: "/AGENT/FrontendAgent(react)/"
---

# 来自你的其他项目迁移过来的经验和记忆

**一、工程形态与目录（可迁移的骨架）**
- **框架基线**：Next.js 14 App Router + React 18 + TypeScript 5（strict），默认写 Server Components，交互组件才下沉 `'use client'`
- **功能即目录**：路由在 `src/app`，业务组件在 `src/components/{domain}`，通用工具在 `src/lib`，类型在 `src/types`
- **组件分层**：`components/ui` 只放无业务的基础组件（Radix/Shadcn风格），业务组件放 `components/reader|search|auth` 这类模块目录

**二、状态管理与数据流（“由近及远”）**
- **组件内状态优先**：表单输入、局部 UI 切换用 `useState/useReducer`，跨多组件再提升或封装自定义 Hook。
- **全局 UI 状态用轻量 Store**：本项目使用 Zustand
- **Server State 单独管理**：本项目规范文档推荐用 TanStack Query，但当前依赖未包含；迁移到其他项目时要么用 Next 的 Server Components + fetch/Server Actions，要么引入 Query 专管请求缓存与重试

**三、样式与组件库（可复用的 UI 体系）**
- **Tailwind 原子化**：统一用 `cn()` 合并类名
- **Radix/Shadcn 组合**：对话框、Switch、ScrollArea 等作为“无业务 UI 积木”，业务组件只负责拼装
- **无障碍与键盘可用性**：Radix 默认提供 A11y，业务层不要破坏其焦点管理与 aria 结构。

**四、前后端契约与 SSE（迁移时最容易踩坑）**
- **以契约文档为唯一事实来源**：接口路径、字段名、分页参数、SSE 事件名必须对齐。
- **SSE 事件约定**：至少支持 `metadata/token/tool_call/tool_result/citation/error/finish`，前端 UI 的“加载中/检索中/中间结果”由 `tool_call/tool_result` 驱动
- **解析策略**：本项目依赖包含 `eventsource-parser`迁移时建议统一封装一个 `streamingClient`：负责断线重连、事件分发、错误映射、超时与取消。

**五、核心业务模块的可迁移实现套路**
  - **性能底线**：滚动模式渲染全页需要虚拟列表，避免一次性渲染所有 Page
  - **worker 管理**：pdfjs worker 推荐走 `public/` 本地静态资源而非外链 CDN，迁移时作为硬规范

- **知识图谱（reagraph）**：节点/边数据结构要与后端契约绑定，渲染时对大对象用 `useMemo`，交互回调用 `useCallback`，避免拖动/缩放时频繁重渲
- **鉴权弹窗（Context + Dialog）**：全局 AuthModal 由 Context 控制打开/视图切换，Dialog 负责可访问性与遮罩

**六、TypeScript 与编码规范（迁移的“硬约束”）**
- **strict + 禁止 any**：未知数据用 `unknown` + 类型守卫；对 API 响应用 schema/类型收口
- **副作用收敛**：渲染阶段保持纯函数语义；DOM 监听、ResizeObserver、订阅类逻辑必须在 `useEffect` 管理并清理（本项目 PDF 组件已体现 ResizeObserver 模式
- **禁止生产代码 mock / console.log**：本项目部分页面仍有模拟数据与 `console.log`

**七、构建与质量门禁（迁移时直接复用）**
- **脚本基线**：`dev/build/start/lint`
- **提交前必过 lint/tsc**：本项目已接入 Next ESLint；迁移时建议补齐 `tsc --noEmit` 作为类型门禁（如果你的项目打开 strict，会非常必要）。
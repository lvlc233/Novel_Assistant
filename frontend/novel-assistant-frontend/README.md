# 前端

## 项目结构
 项目目录结构
src/
├── app/
│   ├── layout.tsx          # 根布局 (包含 CopilotKit Provider)
│   ├── page.tsx            # 首页 (仅展示 Dashboard)
│   ├── editor/             # [新增] 编辑器独立路由
│   │   └── page.tsx        
│   └── globals.css         # 全局样式
├── components/
│   ├── Common/             # [新增] 通用基础组件 (无业务逻辑)
│   │   ├── Button/
│   │   ├── Icon/           # (MailIcon 等)
│   │   ├── Modal/
│   │   └── Input/
│   ├── Layout/             # [新增] 布局相关组件
│   │   ├── Sidebar/        # (原 Sideber)
│   │   └── Header/
│   ├── Features/           # [新增] 业务功能模块
│   │   ├── Home/           # 首页相关 (Dashboard, FeatureCard)
│   │   └── Document/       # 文档编辑相关 (Editor, TOC, NovelCard)
│   └── providers/          # [可选] 全局状态管理或 Context
├── lib/                    # [建议] 工具函数 (原 utils)
│   └── utils.ts
├── types/                  # 类型定义
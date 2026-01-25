# 前端作品列表页体验优化日志

## 基本信息
- **时间**: 2026-01-21 11:55
- **目标**: 优化作品列表页的交互体验，统一文案概念。
- **变更范围**:
    - `src/components/novel-manager/DocumentCarousel.tsx`: 引入 `framer-motion` 实现丝滑的 3D 轮播动画；文案修改。
    - `src/components/novel-manager/NovelCard.tsx`: 文案修改（小说 -> 作品）。
    - `src/components/novel-manager/CreateNovelCard.tsx`: 文案修改（小说 -> 作品）。
    - `src/components/novel-manager/EditNovelModal.tsx`: 文案修改（小说 -> 作品）。

## 验证方式与结果
1.  **验证方式**:
    - 启动前端服务，访问 `/novels` 页面。
    - 检查页面标题是否为“你的作品”。
    - 检查轮播图中的创建卡片文案是否为“创建新作品”。
    - 使用左右箭头键或点击按钮切换作品，观察动画是否流畅、有弹性（Spring 效果）。
    - 点击创建或编辑按钮，检查弹窗内的标签是否统一为“作品名”、“作品状态”等。

2.  **结果**:
    - 动画效果由 CSS transition 升级为 Framer Motion 的 Spring 动画，切换更加自然丝滑。
    - 页面中所有可见的“小说”、“文档”字样已统一替换为“作品”，保持了概念一致性。
    - 整体布局样式保持不变。

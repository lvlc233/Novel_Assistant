# 2026-03-05 15:45:00
目标：重构 PluginSettingsModal 和 ConfigRenderer UI
变更范围：
- src/components/plugins/PluginSettingsModal.tsx
- src/components/dashboard/plugin-renderers/ConfigRenderer.tsx
验证方式：UI 检查（通过代码逻辑验证）
结果：
- PluginSettingsModal: 移除了分割线拖拽，改为固定 35/65 网格布局；新增了 PropertyGrid 和 Skeleton 组件；优化了视觉样式。
- ConfigRenderer: 移除了时间轴样式，改为垂直堆叠卡片布局；使用了现代化的输入框样式。

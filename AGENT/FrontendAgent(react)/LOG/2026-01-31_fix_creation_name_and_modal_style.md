# 变更记录: 修复新建章节命名与弹窗样式问题

- **时间**: 2026-01-31 15:45
- **目标**: 
  1. 修复新建章节时，乐观更新逻辑错误地访问了不存在的 `title` 属性，导致章节名为空的问题。
  2. 修复作品设置弹窗背景透明度过高、样式不统一的问题。
- **变更范围**:
  - `src/app/works/[id]/page.tsx`:
    - `handleCreateChapter`: 将 `newDoc.title` 修正为 `newDoc.name`。`createDocument` 服务返回的是 `NodeDTO`，其属性名为 `name`。
  - `src/components/work-detail/WorkSettingsModal.tsx`:
    - 将模态框容器的背景类从可能的自定义变量（如 `bg-surface-white` 可能未定义或带透明度）显式改为 `bg-white`。
    - 添加了 `border border-stone-200` 以增强边界感。
    - 确保头部区域也有 `bg-white`，避免任何潜在的透视问题。
- **验证方式**:
  - 新建章节：输入名称后创建，检查目录列表中是否立即正确显示了输入的名称，而不是空白。
  - 打开设置：点击设置图标，检查弹窗是否为纯白背景，文字清晰可读，不再有半透明效果。
- **结果**:
  - 解决了用户反馈的“没有名字”和“透明不合理”两个核心体验问题。

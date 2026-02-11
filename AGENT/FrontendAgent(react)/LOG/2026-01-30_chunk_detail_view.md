# 知识库知识点详情展示功能实现

**时间**: 2026-01-30 23:53
**目标**: 实现点击知识库知识点卡片后，在右侧内容区域展示知识点详细内容（包括正文和标签），提供返回列表的导航。
**变更范围**:
- `src/components/knowledge-base/KnowledgeBaseManager.tsx`: 
  - 新增 `selectedChunk` 状态。
  - 新增 `chunk_detail` 视图模式。
  - 实现 `handleSelectChunk` 处理函数。
  - 增加知识点详情视图渲染逻辑（包含返回按钮、正文展示、标签展示）。
- `src/components/knowledge-base/KnowledgeBaseDetail.tsx`:
  - 新增 `onSelectChunk` prop。
  - 为知识点卡片添加点击事件。
  - 阻止删除按钮的点击事件冒泡。

**验证方式**:
1. 编译检查：无类型错误。
2. 逻辑检查：
   - 点击知识点卡片 -> 触发 `onSelectChunk` -> `KnowledgeBaseManager` 切换视图 -> 展示详情。
   - 在详情页点击返回 -> `KnowledgeBaseManager` 切换回 `detail` 视图 -> 展示列表。
   - 点击删除按钮 -> 阻止冒泡 -> 仅触发删除逻辑。
**结果**: 功能实现符合需求，代码逻辑清晰，无副作用。

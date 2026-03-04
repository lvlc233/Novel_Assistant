# 详细实施规范：SDUI 深度适配与功能修复

## 1. 核心目标
本阶段旨在完成 SDUI 架构的深度落地，重点解决插件详情页（Modal）的交互一致性问题，复用遗留的高质量组件，并修复作品管理页面的显示缺陷。

## 2. 详细设计

### 2.1 ProjectHelper 详情页改造
*   **目标 UI**：顶部 Tab 栏（切换 Page/Session） + 双栏 Session 卡片列表。
*   **组件复用**：改造 `ProjectAgentRenderer.tsx` 为 `ProjectSessionManager`。
*   **交互逻辑**：
    1.  初始化加载所有关联的 `page_id`（通常对应不同上下文或会话）。
    2.  用户点击 Tab 切换 `page_id`。
    3.  下方显示该 Page 下的历史 Session 卡片（复用“窄长黑条”卡片样式）。
    4.  点击卡片展开查看历史消息。

### 2.2 DocumentHelper 详情页改造
*   **目标 UI**：左侧/顶部文档层级导航 -> 右侧/下方 Session 列表。
*   **组件开发**：新建 `DocumentSessionManager`。
*   **交互逻辑**：
    1.  加载当前作品下的文档树。
    2.  选择文档节点。
    3.  显示该文档关联的 AI 对话历史。

### 2.3 配置项 (Config) 修复
*   **问题根源**：`ProjectHelper` 使用 `Inject` 注入依赖，导致 `@runtime_config` 可能未正确解析非注入参数，或者前端未正确处理空值。
*   **修复方案**：
    *   后端：确保 `config_schema` 包含 `model_name`, `base_url` 等字段。
    *   前端：`ConfigRenderer` 增加对 `string` 类型的默认渲染支持。

### 2.4 作品管理页面 (/works) 修复
*   **现状**：代码被注释。
*   **修复**：恢复 `DocumentCarousel` 及其在 Page 中的调用。

## 3. API 协议更新

### ProjectHelper.get_info
```json
{
  "name": "project_helper",
  "info_type": "ProjectSessionManager",
  "data": {
    "pages": [
      { "id": "page_1", "name": "首页", "sessions": [...] },
      { "id": "page_2", "name": "编辑器", "sessions": [...] }
    ]
  }
}
```

### DocumentHelper.get_info
```json
{
  "name": "document_helper",
  "info_type": "DocumentSessionManager",
  "data": {
    "documents": [
      { "id": "doc_1", "title": "第一章", "sessions": [...] }
    ]
  }
}
```

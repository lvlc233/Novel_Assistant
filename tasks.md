# 任务清单 (30+ 细分任务)

## 阶段一：配置项修复 (Config Fixes)
- [ ] **FE**: 检查 `src/components/dashboard/plugin-renderers/ConfigRenderer.tsx`，确保能渲染无默认值的 String 字段 <!-- id: 1 -->
- [ ] **FE**: 调试 `PluginSettingsModal.tsx`，打印 `config_schema` 数据，确认前端是否接收到 <!-- id: 2 -->
- [ ] **BE**: 检查 `ProjectHelperPlugin.__init__`，确保 `base_url` 等字段被 `@runtime_config` 正确捕获 <!-- id: 3 -->
- [ ] **BE**: 验证 `PluginService.get_plugin_detail` 返回的 `config` 字段是否非空 <!-- id: 4 -->
- [ ] **BE**: 为 `DocumentHelper` 添加 `config_schema` 定义（如有缺失） <!-- id: 5 -->

## 阶段二：ProjectHelper 深度适配
- [ ] **FE**: 复制 `src/components/dashboard/plugin-renderers/ProjectAgentRenderer.tsx` 为 `src/components/sdui/ProjectSessionManager.tsx` <!-- id: 6 -->
- [ ] **FE**: 在 `ProjectSessionManager` 中增加顶部 Tabs 组件（用于切换 Page） <!-- id: 7 -->
- [ ] **FE**: 适配 Props 接口，使其接收 `pages: {id, name, sessions}[]` 数据结构 <!-- id: 8 -->
- [ ] **FE**: 将 `ProjectSessionManager` 注册到 `src/components/registry.tsx` <!-- id: 9 -->
- [ ] **BE**: 在 `ProjectHelperPlugin` 中实现 `get_project_sessions` 逻辑 <!-- id: 10 -->
- [ ] **BE**: 修改 `ProjectHelperPlugin.get_config` (或新增 `get_info`) 操作，使其 `ui_target` 指向 `Home.PluginDetails.Info` <!-- id: 11 -->
- [ ] **BE**: 确保返回数据包含 `info_type: "ProjectSessionManager"` <!-- id: 12 -->

## 阶段三：DocumentHelper 深度适配
- [ ] **FE**: 创建新组件 `src/components/sdui/DocumentSessionManager.tsx` <!-- id: 13 -->
- [ ] **FE**: 实现左侧文档树/列表选择器 UI <!-- id: 14 -->
- [ ] **FE**: 实现右侧 Session 列表 UI（可复用 ProjectSessionManager 的卡片样式） <!-- id: 15 -->
- [ ] **FE**: 将 `DocumentSessionManager` 注册到 `src/components/registry.tsx` <!-- id: 16 -->
- [ ] **BE**: 在 `DocumentHelperPlugin` 中实现文档树获取逻辑 (Mock 或真实数据) <!-- id: 17 -->
- [ ] **BE**: 新增 `get_document_info` 操作，映射到详情页 <!-- id: 18 -->
- [ ] **BE**: 确保返回数据结构符合前端组件要求 <!-- id: 19 -->

## 阶段四：其他插件组件复用
- [ ] **FE**: 确保 `WorkTypeSettings` (作品类型) 已注册并测试通过 <!-- id: 20 -->
- [ ] **BE**: 检查 `WorkTypePlugin.manage_work_types` 返回的 `info_type` 是否匹配 <!-- id: 21 -->
- [ ] **FE**: 确保 `MemoryManager` (记忆) 已注册并测试通过 <!-- id: 22 -->
- [ ] **BE**: 检查 `MemoryPlugin.manage_memories` 返回的 `info_type` 是否匹配 <!-- id: 23 -->
- [ ] **FE**: 确保 `KnowledgeBaseManager` (知识库) 已注册并测试通过 <!-- id: 24 -->
- [ ] **BE**: 检查 `KDPlugin.manage_knowledge_bases` 返回的 `info_type` 是否匹配 <!-- id: 25 -->

## 阶段五：作品管理页面修复 (/works)
- [ ] **FE**: 解注 `src/components/work-manager/DocumentCarousel.tsx` 的所有代码 <!-- id: 26 -->
- [ ] **FE**: 修复 `DocumentCarousel` 中可能的类型错误或缺失依赖 <!-- id: 27 -->
- [ ] **FE**: 解注 `src/app/works/page.tsx` 中的组件引用 <!-- id: 28 -->
- [ ] **FE**: 验证 `/works` 页面卡片能否正常渲染 <!-- id: 29 -->

## 阶段六：集成测试与清理
- [ ] **Test**: 启动后端服务，运行 `scripts/verify_plugin_loading.py` 确保无报错 <!-- id: 30 -->
- [ ] **Test**: 打开浏览器，逐个点击 6 个插件卡片，验证详情页是否正常显示配置和数据 <!-- id: 31 -->
- [ ] **Test**: 验证 `/works` 页面交互 <!-- id: 32 -->

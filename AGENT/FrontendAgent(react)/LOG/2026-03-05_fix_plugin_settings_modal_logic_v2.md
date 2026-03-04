# 修复 PluginSettingsModal 逻辑

**时间**: 2026-03-05 05:22
**目标**: 修复 PluginSettingsModal 中的数据获取路径和 AgentManager 操作，以匹配后端数据结构的变更。
**变更范围**: 
- `frontend/novel-assistant-frontend/src/components/plugins/PluginSettingsModal.tsx`

**详细变更**:
1.  **修复数据路径 (Fix Data Path)**:
    - 修改了 `fetchData.then` 块中的数据解包逻辑。
    - 优先检查 `response.payload?.ui_target` 和 `response.payload?.info_type` 来确定 UI Target。
    - 优先使用 `response.payload.data` 作为组件数据，并保留了对 `response.payload` 和原始 `response` 的回退支持。
    - 确保传递给 `SDUIRenderer` 的 `props` 是正确解包后的数据对象。

2.  **修复 AgentManager 操作 (Fix AgentManager Operation)**:
    - 将 AgentManager 的调用从 `invokePlugin(..., 'list_agent_plugins', ...)` 修改为 `invokePlugin(..., 'get_agent_info_in_card', ...)`。
    - 移除了不再需要的参数映射。

3.  **代码清理 (Cleanup)**:
    - 增强了数据处理的健壮性，能够适应包装和未包装的响应格式。

**验证方式**:
- 人工代码审查：确认逻辑符合用户需求。
- 静态分析：确认类型和属性访问的正确性。

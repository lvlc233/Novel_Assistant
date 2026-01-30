# 变更记录: 修复Work模块路由路径与规范不一致问题

- **时间**: 2026-01-30 10:11
- **目标**: 验证并修复 "接口路由前缀与路径未对齐规范" (Task 1) 中的遗留问题。
- **变更范围**: 
  - `backend/src/api/routes/work/router.py`:
    - 将 `/work/{work_id}/plugins` 修改为 `/work/{work_id}/plugin` (单数)。
    - 将 `/work/{work_id}/plugins/{plugin_id}` 修改为 `/work/{work_id}/plugin/{plugin_id}` (单数)。
    - 将 `PUT` 方法修改为 `PATCH` 方法，以符合文档规范。
- **验证方式**: 
  - 对比 `PROJECT/DOCUMENTS/项目统一技术架构文档(重要).md` 中的接口定义。
  - 检查代码实现。
- **结果**: 
  - 修复了 `work` 模块下的路由路径不一致问题。
  - 现在 Task 1 "接口路由前缀与路径未对齐规范" 真正完成。

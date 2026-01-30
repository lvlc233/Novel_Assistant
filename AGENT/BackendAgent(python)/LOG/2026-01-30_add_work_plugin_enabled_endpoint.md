# 变更记录: 添加作品插件启用状态更新接口

- **时间**: 2026-01-30 10:57
- **目标**: 对齐项目统一技术架构文档，补充缺失的 `PATCH /work/{work_id}/plugin/{plugin_id}/enabled` 接口。
- **变更范围**:
    - `backend/src/api/routes/work/schema.py`: 修改 `UpdateWorkPluginRequest`，使 `config` 字段可选（Optional）。
    - `backend/src/services/work/service.py`: 修改 `update_work_plugin` 方法，支持仅更新 enabled 状态而不覆盖配置。
    - `backend/src/api/routes/work/router.py`: 添加新的路由 endpoint。
- **验证方式**: 静态代码分析。
- **结果**:
    - 接口已添加。
    - 服务层逻辑已增强，支持局部更新。
    - 保持了与现有接口的兼容性。

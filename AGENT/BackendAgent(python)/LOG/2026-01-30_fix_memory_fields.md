# Memory 模块接口与文档对齐记录

## 变更时间
2026-01-30

## 变更目标
将 Memory 模块的接口定义与 `项目统一技术架构文档(重要).md` 进行对齐。

## 变更范围
1.  `backend/src/api/routes/memory/schema.py`: 
    -   将 `MemoryMetaResponse`, `MemoryDetailResponse`, `MemoryUpdateRequest` 中的 `enable` 字段重命名为 `enabled`。
2.  `backend/src/services/memory/service.py`:
    -   更新 `get_memory_list`, `get_memory_detail`, `create_memory` 方法中返回的 `MemoryMetaResponse` 和 `MemoryDetailResponse` 构建逻辑，使用 `enabled=True`。
    -   更新 `update_memory` 中的注释，反映字段名称变更 (`request.enable` -> `request.enabled`)。

## 验证方式
1.  **代码审查**: 确认所有 `enable` 字段的引用都已更新为 `enabled`。
2.  **一致性检查**: 对比 `schema.py` 定义与架构文档中的 "记忆模块(插件)" 部分，确认字段名称一致。

## 结果
Memory 模块接口定义现已符合架构文档要求。

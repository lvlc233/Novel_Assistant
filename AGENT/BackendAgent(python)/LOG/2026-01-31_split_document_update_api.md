# 变更记录

## 基本信息
- **时间**: 2026年01月31日 19:36
- **提交人**: BackendAgent(python)
- **目标**: 拆分文档更新接口为"基础信息更新"和"版本内容更新"两个独立接口，并修复相关单元测试。

## 变更范围
### 1. API 接口拆分 (`backend/src/api/routes/node/router.py`)
- 修改 `PATCH /work/{work_id}/document/{document_id}`: 仅用于更新文档基础信息 (标题、描述、父节点)。
- 新增 `PATCH /work/{work_id}/document/{document_id}/version/{version_id}`: 用于更新指定版本的文档内容 (`full_text`)。

### 2. 数据模型调整 (`backend/src/api/routes/node/schema.py`)
- `DocumentUploadRequest`: 移除 `full_text` 字段。
- 新增 `DocumentVersionUploadRequest`: 包含 `full_text` 字段。

### 3. 业务逻辑更新 (`backend/src/services/node/service.py`)
- `update_node`: 移除内容更新逻辑，专注于基础信息更新。
- 新增 `update_document_version_content`: 实现特定版本内容的更新，包含版本归属权校验。
- 修复 `ValueError` 异常: 修正了 UUID 类型与 String 类型比较的问题。

### 4. 测试用例更新
- `backend/tests/api/test_node.py`: 更新 `test_update_document`，分离基础信息更新和内容更新的测试步骤。
- `backend/tests/api/test_node_version.py`: 更新 `test_document_version_switch`，适配新的版本内容更新接口流程。

## 验证方式与结果
- **验证方式**: 运行 `pytest` 执行所有 API 测试用例。
- **验证结果**:
  - `tests/api/test_node.py`: Pass
  - `tests/api/test_node_version.py`: Pass
  - 全量测试 (32 passed): Pass

## 备注
- 此次变更严格遵循了《项目统一技术架构文档》中关于文档更新接口拆分的要求。
- 解决了前端因接口合并导致的版本内容更新混淆问题。

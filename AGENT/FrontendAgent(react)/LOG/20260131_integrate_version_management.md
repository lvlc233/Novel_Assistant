# Frontend Change Log

## 基本信息
- **时间**: 2026-01-31 18:20
- **提交人**: FrontendAgent(react)
- **目标**: 对接版本管理接口（删除功能），修复版本号显示问题（使用后端返回的版本名称）。

## 变更范围
1.  **UI组件 (`src/components/editor/DocumentEditor.tsx`)**:
    -   更新 `versionList` 状态类型为 `DocumentVersionItem[]`，以存储完整版本信息（ID、名称、创建时间）。
    -   修改版本下拉框渲染逻辑：
        -   当前版本显示：优先显示 `versionList` 中对应的 `version` 名称，解决显示被截断 ID 的问题。
        -   列表项显示：显示版本名称和创建时间。
    -   新增版本删除功能：在下拉列表中添加删除按钮，调用 `deleteDocumentVersion` 接口。
2.  **服务层 (`src/services/documentService.ts`)**:
    -   更新 `getDocumentVersions` 返回类型为 `Promise<DocumentVersionItem[]>`。
    -   新增 `deleteDocumentVersion` 方法对接后端 `DELETE` 接口。
3.  **模型层 (`src/services/models.ts`)**:
    -   新增 `DocumentVersionItem` 接口定义。
    -   更新 `DocumentVersionResponse` 使用 `DocumentVersionItem[]`。

## 验证方式与结果
1.  **代码逻辑验证**:
    -   检查 `fetchVersions` 能够正确解析后端返回的 `DocumentVersionItem` 数组。
    -   验证 `handleSwitchVersion` 依然使用 ID 进行切换，符合后端逻辑。
    -   验证下拉框渲染逻辑能够根据 ID 查找到对应的 Name 进行显示，解决了“随机版本号/ID显示”的问题。
    -   验证删除操作流程：确认提示 -> 调用接口 -> 刷新列表 -> 若删除当前版本则刷新当前文档。

## 备注
-   解决了用户反馈的“指定了名称但是版本号还是随机（ID）”的问题。
-   完成了架构文档中新增的 DELETE 版本接口的对接。

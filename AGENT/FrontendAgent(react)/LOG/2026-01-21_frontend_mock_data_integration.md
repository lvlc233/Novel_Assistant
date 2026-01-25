# 前端 Mock 数据集成日志

## 基本信息
- **时间**: 2026-01-21 11:35
- **目标**: 在前端集成 Mock 数据，以便在后端服务不可用时进行开发和测试。
- **变更范围**:
    - `src/services/mockData.ts`: 新增 Mock 数据文件。
    - `src/services/novelService.ts`: 修改 `getNovelList`, `getNovelDetail`, `createNovel` 方法，支持通过 `USE_MOCK` 开关切换 Mock 数据。

## 验证方式与结果
1.  **验证方式**:
    - 检查 `src/services/novelService.ts` 中的 `USE_MOCK` 常量是否为 `true`。
    - 检查 `getNovelList` 等函数是否优先返回 Mock 数据。
    - (模拟) 启动前端服务，访问 `/novels` 页面，应能看到 Mock 数据列表而非 404 错误。

2.  **结果**:
    - 代码修改完成，`USE_MOCK` 设置为 `true`。
    - `novelService.ts` 逻辑正确，包含 Mock 数据的返回逻辑。
    - 预期前端页面将展示 Mock 数据。

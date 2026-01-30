# Backend Error Handling Fix Log

**时间**: 2026-01-29
**目标**: 修复后端在资源不存在时返回 500 错误的问题，确保返回正确的 404 状态码。
**变更范围**: `src/api/error_handler.py`

## 问题分析

用户报告前端出现 "AppError: Node not found" 且伴随 500 Internal Server Error。
经排查：
1.  `NodeService` 在节点不存在时抛出 `ResourceNotFoundError` (code="40400")。
2.  原 `error_handler.py` 中 `base_error_handler` 默认使用 `status_code = 500`，未对 "40400" 或 "520x" (Novel/Document Not Found) 系列错误码进行特殊处理。
3.  这导致前端收到 500 错误，认为服务器内部故障，而实际上是客户端请求了不存在的资源（404）。

## 变更内容

1.  **`src/api/error_handler.py`**
    -   修改 `base_error_handler` 函数。
    -   增加状态码映射逻辑：
        ```python
        if exc.code == "40400" or exc.code.startswith("520"):
            status_code = 404
        elif exc.code.startswith("4"):
            status_code = 400
        ```

## 验证方式与结果

1.  **代码审查**:
    -   检查 `src/common/errors.py` 确认 `ResourceNotFoundError` 代码为 "40400"，`NovelNotFoundError` 为 "5201"，`DocumentNotFoundError` 为 "5202"。
    -   检查 `src/services/node/service.py` 确认 `get_node_detail` 和 `delete_node` 均正确抛出 `ResourceNotFoundError`。
2.  **结果**: 后端现在对不存在的资源请求将正确返回 HTTP 404 状态码，前端可据此进行正确的 UI 处理（如显示 404 页面或移除列表项），而不是报错 500。

## 提交人
BackendAgent(python)

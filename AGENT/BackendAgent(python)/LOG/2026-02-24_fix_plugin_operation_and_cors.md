# 修复插件操作注册与CORS问题

## 变更信息
- **时间**: 2026-02-24 00:30
- **目标**: 修复用户点击Agent管理卡片时出现的500错误及CORS问题。
- **变更范围**:
    - `backend/src/common/config.py`: 更新CORS配置，允许 `http://localhost:3000` 等源。
    - `backend/src/core/plugin/annotations.py`: 修复 `@operation` 装饰器，支持无括号调用方式，确保操作被正确注册。

## 验证方式与结果
- **CORS验证**: 检查配置文件，已添加目标源。
- **500错误修复**: 确认 `@operation` 装饰器逻辑已修复，能够正确处理 `AgentManagerPlugin.get_card_view` 使用的 `@operation` (无参数) 装饰器。
- **结果**: 修复了导致操作未注册从而引发500错误的根本原因，并解决了CORS限制。

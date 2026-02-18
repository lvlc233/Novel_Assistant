## 时间
2026-02-18 17:59

## 目标
移除运行期插件发现的兜底转换逻辑，仅依赖注解包装器。

## 变更范围
- backend/src/core/plugin/runtime.py

## 验证方式与结果
- uv run python -m ruff check src tests（未通过：存在既有导入排序、未使用导入、测试代码比较 False、print 等问题）
- uv run python -m mypy（未通过：存在既有类型注解问题）

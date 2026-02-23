## 变更记录
- 时间: 2026-02-24 00:26
- 目标: 注释后端未被前端使用的接口
- 变更范围: api/routes/agent/document_helper/router.py, api/routes/plugin/router.py, api/routes/work/router.py, api/routes/node/router.py
- 验证方式: ruff check .; mypy .
- 验证结果: ruff 成功，mypy 失败（存在项目既有问题，未引入新增问题）

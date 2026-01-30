# 后端路由对齐修复日志

## 基本信息
- **时间**: 2026-01-30 09:45
- **执行人**: BackendAgent(python)
- **目标**: 将后端接口路由前缀与路径统一至 `PROJECT/SPECIFICATION.md` (项目统一技术架构文档) 约定。

## 变更范围
涉及以下文件的路由前缀修改：
1. `backend/src/api/routes/work/router.py`: `/works` -> `/work`
2. `backend/src/api/routes/plugin/router.py`: `/plugins` -> `/plugin`
3. `backend/src/api/routes/memory/router.py`: `/memories` -> `/plugin/memory`
4. `backend/src/api/routes/agent/router.py`: `/agents` -> `/plugin/agent/manager`
5. `backend/src/api/routes/knowledge_base/router.py`: `/knowledge-bases` -> `/plugin/kd`
6. `backend/src/api/routes/node/router.py`: 
   - `/works/{work_id}/documents` -> `/work/{work_id}/documents`
   - `/works/{work_id}/nodes` -> `/work/{work_id}/nodes`
   - 以及相关的 delete/patch/get 路由。

## 验证方式
- 静态代码分析: 使用 `ruff` 检查语法正确性 (通过，遗留 docstring 警告将在后续任务处理)。
- 对照文档: 确认修改后的路径与架构文档中的接口清单一致。

## 结果
- 状态: 已完成
- 下一步: 处理 "Work/Document/Memory 等响应与请求字段命名偏离规范" 问题。

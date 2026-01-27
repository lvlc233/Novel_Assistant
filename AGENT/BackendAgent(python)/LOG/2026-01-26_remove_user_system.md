
# 2026-01-26 移除用户系统重构日志

## 目标
响应用户需求，移除项目中所有关于用户的概念、代码和数据库表，将系统转换为单用户/无用户模式。

## 变更范围
1.  **数据库模型 (pg_models.py)**:
    - 删除了 `UserSQLEntity` 和 `Users` (遗留表) 模型。
    - 移除了 `WorkSQLEntity` 中的 `user_id` 字段。
    - 生成并执行了 Alembic 迁移脚本 `a818cba4083a_remove_user_and_user_id.py`。
    - **注意**: 迁移脚本手动修正，保留了 `checkpoints` 和 `checkpoint_writes` 表（LangGraph 持久化所需），避免了误删。

2.  **API 接口 (api/routes)**:
    - 删除了 `api/routes/user` 模块。
    - 删除了 `api/routes/kd` 模块（其中包含 `user_id` 且为未使用的遗留代码）。
    - 修改了 `app.py`，移除了 `user_router` 的注册。
    - 确认 `work`, `plugin`, `node`, `agent` 路由均无 `user_id` 依赖。

3.  **服务层 (Services)**:
    - 删除了 `pg_client.py` 中的用户相关方法 (`create_user`, `check_user_exist_by_id`, `user_login`)。
    - 确认 `WorkService` 中的创建和查询逻辑不再依赖 `user_id`。

4.  **公共模块 (Common)**:
    - 删除了 `errors.py` 中的用户相关异常类 (`UserExistsError`, `UserNotFoundError`, `UserLoginError` 等)。

5.  **测试 (Tests)**:
    - 更新了 `e2e_flow_test.py`，移除了用户注册步骤，直接从创建作品开始。

## 验证结果
- **数据库迁移**: `alembic upgrade head` 执行成功，数据库中 `user` 相关表已被移除，`work` 表结构已更新。
- **端到端测试**: `e2e_flow_test.py` 运行通过。
    - 成功创建作品 (无 user_id)。
    - 成功启用插件。
    - 成功创建 Agent (Master, Outline, Knowledge Builder)。
    - 成功创建节点。
    - 成功调用 Agent (含持久化状态检查)。

## 结论
系统已成功移除用户概念，核心功能（作品、插件、文档、Agent）运行正常。

---
name: BackendAgent(python)的记忆
description: |
    这里是BackendAgent(python)Agent的操作记录。在项目进行的时候，BackendAgent(python)要根据项目的需求和进度，更新自己的操作记录。
    所有的操作必须记录在操作记录中。并且不可以覆盖之前的操作记录。必须使用追加的信息进行记录。
    [BackendAgent(python)必读(选最新若干项读)和更新]
author: "lxz"
state: OK
created: 2026-01-01
path: "/AGENT/BackendAgent(python)/"
---

项目使用的uv,所以进行依赖安装的时候,应该使用uv add 来安装依赖。
 
# 来自你的其他项目迁移过来的经验和记忆
**一、架构与分层（最关键的可迁移点）**
- **3+1/四层分离**：Controller（Web）/ Service（业务编排）/ Infrastructure（DB/Redis/外部服务封装）/ Data(Entity)（纯模型无逻辑），Controller 不写业务，Repository/Infrastructure 不写业务，业务只在 Service 聚合与编排

- **模块化而非“全局大杂烩”**：模型与 schema 尽量跟随模块 colocate；只有跨多个不相关模块复用时才上移到 common

- **“重活下沉”**：PDF解析/OCR/向量化等 IO+CPU 任务放到 Service/Infrastructure，并优先通过异步任务队列/Worker 执行，Agent/Controller 只查状态与结果

**二、API契约优先（前后端对齐的套路）**
- **先锁定契约文档**：以 API 需求文档做“唯一事实来源”，后端接口、字段名、分页参数、SSE事件名全部对齐
- **统一前缀与REST风格**：例如 `/api/v1/...`，列表必须分页，详情按 id，删除返回约定结构
- **SSE统一协议**：至少包含 `metadata/token/tool_call/tool_result/error/finish`，并明确 data 结构；前端需要 loading/中间结果时，靠 `tool_call/tool_result`


**三、数据模型与类型边界（强类型=长期可维护性）**
- **显式输入/输出模型**：任何公开接口（Controller/Service）必须定义 Input/Output schema，禁止 dict/Any 透传
- **Entity不出层**：数据库 Entity（SQLModel）严禁直接作为 Response 输出；Service 负责转换为 DTO/Response schema
- **JSON字段策略**：作者列表/引用 sources 等非范式化结构，统一用 JSON/JSONB 存储，避免用“逗号字符串”走捷径

**四、异步与并发安全（默认按高并发设计）**
- **所有 I/O 全 await**：DB/HTTP/文件/Redis 都按异步方式写，避免阻塞事件循环
- **CPU密集任务严禁在请求线程硬跑**：解析、embedding、分块等必须 offload 到线程池或 worker（Arq/队列），并通过状态表/进度字段给前端轮询

**五、安全基线（默认必须具备）**
- **JWT鉴权**：登录/注册/获取当前用户信息三件套，token 含 `sub` 与 `exp`，密码哈希
- **权限校验在Controller做入口拦截**：资源所有权（paper_id 是否归属 user）是最常见规则；文件下载/直链也要校验（
- **敏感信息策略**：密钥不落日志、不入 git；配置系统里敏感字段要加密存储并记录审计

**六、存储/缓存/配置（可直接套用的工程套路）**
- **文件存储分层**：上传先临时区，处理完成再转持久区；本地/对象存储（S3/MinIO）目录结构固定，便于迁移与清理
- **配置系统四级思路**：系统默认→用户偏好→会话临时→Agent专属；配缓存（内存/Redis）+ 失效通知 + 版本迁移

**七、日志、可追溯与交付标准（迁移时最容易忽略）**
- **日志必须结构化且可定位**：至少能串起来“请求输入→关键决策→外部调用→输出/异常”；对流式 SSE 要有 run_id/session_id
- **时间规范**：统一时区（上海），记录精确到“分钟”（本项目规格要求时间字段随上下文传递，且开发记录需要到分钟级
- **禁止用“临时假数据”顶逻辑**：没验收/没测试的功能保持 TODO 状态，不要用 mock 业务数据伪装完成
- **操作记录（面向迁移复盘）**：每次可验收改动记录“目标/范围/验证方式/结果”，并以时间线可追踪

**八、测试与验收（“能跑”不是标准，“可回归”才是）**
- **最小测试闭环**：每个模块至少覆盖 Service 的核心逻辑 + Router 的主路径（CRUD/分页/鉴权/错误码/SSE事件）。
- **围绕契约做断言**：请求/响应 schema、分页字段、状态机字段（pending/processing/completed/failed）必须可回归

**九、项目演进记录 (Novel Assistant Refactoring Journey)**
*(2026-01-15 B1-B5 Backend Refactoring)*

**1. 原始状态 (Before)**
- **结构混乱**: 业务逻辑与路由耦合在 `api/routers` 单文件中；Agents 散落在 `agent_runnable` 和 `core/agents`，结构不统一。
- **配置硬编码**: 数据库 URL、Host、Port、Log Level 直接写死在代码中，难以适应多环境。
- **类型系统混用**: Agent State 混用 Pydantic BaseModel 和 TypedDict，导致 LangGraph 兼容性问题。
- **基础设施缺失**: Alembic 存在但无法运行（环境配置加载失败）；`PGClient` 功能不全，依赖全局 Session。
- **路由管理**: 在 `app.py` 中硬编码路由前缀，导致维护困难。

**2. 重构后状态 (After)**
- **Clean Architecture (3+1)**: 
    - **Api**: 仅负责路由分发和参数校验 (`src/api/routes/{feature}`).
    - **Service**: 纯业务逻辑，通过依赖注入接收 Session (`src/services/{feature}`).
    - **Infrastructure**: 统一的数据访问层 (`src/infrastructure/pg`), `PGClient` 封装通用 CRUD。
    - **Data/Model**: 纯净的 SQLModel 实体 (`src/infrastructure/pg/pg_models.py`) 和 Pydantic Schema (`src/api/routes/{feature}/schema.py`).
- **统一配置管理**: 引入 `src/common/config.py` (Pydantic Settings)，统一管理环境变量，消除硬编码。
- **Agent 模块化**: 
    - 采用 **Co-location** 模式：`Graph`, `Nodes`, `State`, `Prompts` 放置在同一模块目录下 (`src/core/agents/{agent_name}`).
    - 统一使用 **TypedDict** 作为 State 定义，符合 LangGraph 最佳实践。
- **工程化提升**:
    - **依赖管理**: 强制使用 `uv`。
    - **DB 迁移**: 修复 Alembic 环境配置，支持自动生成迁移脚本。
    - **异常处理**: 建立 `src/common/errors.py` 异常体系和全局 Error Handler。


# 后端任务

# 介绍
后端重构任务：基于 `PROJECT/DOCUMENTS/项目统一技术架构文档(重要).md` (v1.1) 进行全面重构，支持插件化架构。

## 任务状态图例
- 🔴 **Pending**: 待处理
- 🟡 **In Progress**: 进行中
- 🟢 **Completed**: 已完成
- ⚪ **Depreciated**: 已废弃
- 🔵 **Review & Rework**: 审核或重做

## 任务列表
| ID | 模块 | 任务描述 | 负责人 | 状态 | 开始时间 | 完成时间 | 验收标准 | 关联任务及其关系 | 细节 |
|---|---|---|---|---|---|---|---|---|---|
| B1 | 基础设施 | **数据库模型重构 (Models)**<br>1. 实现 `Plugin`, `Work`, `WorkPluginMapping` 表<br>2. 实现 `Node`, `NodeRelationship`, `DocumentVersion` 表<br>3. 实现 `AgentManager`, `KnowledgeBase`, `Memory` 表<br>4. 生成并执行 Alembic 迁移脚本 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 数据库表结构与设计文档一致，alembic upgrade 成功 | | 已完成: Plugin, Work, Node, User模型及迁移 |
| B2 | 核心服务 | **插件服务 (PluginService)**<br>实现插件注册、查询、全局配置管理逻辑。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 能正确读写 Plugin 表，处理默认配置与 Schema | B1->B2 | 已完成: 基础CRUD |
| B3 | 核心服务 | **作品服务 (WorkService)**<br>实现作品创建、元数据更新、插件启用/配置覆盖逻辑。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 能创建 Work，并正确关联 WorkPluginMapping | B1->B3 | 已完成: 基础CRUD与插件映射 |
| B4 | 核心服务 | **节点服务 (NodeService)**<br>实现节点(文档/文件夹)的增删改查、版本管理、关系管理。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 支持无限层级目录，支持文档版本回滚 | B1->B4 | 已完成: 基础节点操作与文档版本 |
| B5 | 接口层 | **插件管理 API (500xx)**<br>实现 `/plugins` 相关 RESTful 接口。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 接口符合文档定义，Swagger 测试通过 | B2->B5 | 已集成到 app.py |
| B6 | 接口层 | **作品管理 API (510xx)**<br>实现 `/works` 相关接口 (含插件配置子资源)。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 接口符合文档定义，Swagger 测试通过 | B3->B6 | 已集成到 app.py |
| B7 | 接口层 | **文档管理 API (511xx)**<br>实现 `/works/{id}/documents` (nodes) 相关接口。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 接口符合文档定义，Swagger 测试通过 | B4->B7 | 实现为 /nodes API |
| B8 | Agent体系 | **Agent管理服务与API (62xxx)**<br>实现 Agent 的动态注册、配置持久化及管理接口。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 能动态读取 Agent 配置 | B1->B8 | 已完成: 基础CRUD与API |
| B9 | Agent体系 | **LangGraph 持久化集成**<br>配置 PostgresCheckpointer，实现 Agent 状态入库。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | Agent 对话历史可恢复 | B8->B9 | 已实现自定义 PostgresCheckpointer 并集成到 Graph 和 API |

| B10 | 验证 | **端到端验证**<br>验证从创建作品->开启插件->创建文档->Agent 辅助的完整流程。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 核心链路跑通，E2E 测试通过 | B5,B6,B7,B9->B10 | 已验证: 注册->作品->插件(启用)->节点->Agent(持久化)(含 Outline Agent) |

| B11 | Agent体系 | **知识Agent (KD Agent)**<br>完善并测试知识提取 Agent (KD_build_agent) 的逻辑与流式输出。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 单元测试通过，能生成 Cypher 语句 | B10->B11 | 已集成到服务层，通过 E2E 测试，Mock 模型支持结构化输出 |

| B12 | 系统重构 | **移除用户系统**<br>移除所有用户相关的代码、数据库表、API接口，使系统变为单用户/无用户模式。 | BackendAgent(python) | 🟢 | 2026-01-26 | 2026-01-26 | 代码中无 user 相关逻辑，数据库移除 user 表，E2E 测试通过 | B1,B10->B12 | 已完成: 删除 UserSQLEntity, user router, user service |

## 历史归档
(B1-B6 已归档，详情见 Git 历史或旧版 LOG)

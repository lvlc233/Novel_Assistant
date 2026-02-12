# 插件渲染协议与数据源配置文档更新日志

**时间**: 2026-02-12 11:43
**目标**: 补充插件 UI 类型、RenderType 与 Payload 协议，并扩展数据源配置描述。

**变更范围**:
- `PROJECT/DOCUMENTS/项目统一技术架构文档(重要).md`
  - 将 UI 标准化描述调整为 RenderType + Payload 协议。
  - 扩展插件 UI 类型为 CONFIG / AGENT_MESSAGES / CARD 等。
  - 增加 RenderType 与 Payload 最小结构对照表。
  - 将 data_source_url 改为 data_source_type 与 data_source_config 的描述。
  - 更新插件管理模型明细中的 RenderType 与 StandardDataResponse 结构。

**验证方式**:
- 文档一致性检查：确认架构概览、插件概念、模型明细中的术语一致。

**结果**: 文档更新完成，结构与术语已对齐。

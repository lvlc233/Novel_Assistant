# 变更日志：替换字数显示为作品类型

**时间**: 2026-01-31 00:09
**目标**: 将作品列表卡片中的“字数”字段替换为“作品类型”，并移除未使用的字数相关代码，以符合《项目统一技术架构文档》。
**变更范围**:
1.  `src/components/novel-manager/NovelCard.tsx`: 将原本显示字数的 UI 区域修改为显示 `novel.type`，若类型为空则回退显示“通用”。
2.  `src/types/novel.ts`: 从 `Novel` 接口中移除了 `wordCount` 字段。
3.  `src/services/novelService.ts`: 移除了 DTO 映射和 Mock 数据生成逻辑中对 `wordCount` 的赋值。
**验证方式与结果**:
-   确认 `src/services/models.ts` 中的 `WorkMetaDTO` 包含 `type` 字段，且无 `wordCount` 字段，与修改后的前端模型一致。
-   代码静态检查无类型错误。

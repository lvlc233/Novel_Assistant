# 前端项目结构清理日志

**时间**: 2026年01月16日 16:13
**目标**: 清理前端错误的项目结构，统一目录命名规范，合并工具类。

**变更范围**:
1.  **目录重命名**:
    -   src/components/Document -> src/components/novel-manager
    -   src/components/DocumentEdit -> src/components/editor
    -   src/components/Home -> src/components/dashboard
    -   src/components/NovelDetail -> src/components/novel-detail
    -   src/components/Settings -> src/components/settings
    -   src/components/Table -> src/components/table-of-contents
2.  **工具类合并**:
    -   移除 src/utils 目录。
    -   统一使用 src/lib/utils.ts。
3.  **组件移动**:
    -   移动 src/components/Mail/MailIcon.tsx -> src/components/common/MailIcon.tsx。
    -   移除 src/components/Mail 目录。
4.  **代码更新**:
    -   批量更新所有 .ts / .tsx 文件中的 import 路径。
    -   修复 DocumentEditor.tsx 中的相对路径引用问题。

**验证方式**:
-   执行 
px tsc --noEmit 进行静态类型检查。
-   人工核查文件目录结构。

**结果**:
-   	sc 检查通过 (Exit Code 0)。
-   目录结构已符合 kebab-case 规范。
-   无冗余空目录残留。

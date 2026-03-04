# 2026-03-05 Update Session Data Structures

## 目标
Update `backend/src/core/ui/home.py`, `backend/src/plugin/agent_manager/project_helper/plugin.py`, and `backend/src/plugin/agent_manager/document_helper/plugin.py` to define and use `ProjectSessionData` and `DocumentSessionData` structures.

## 变更范围
1.  **backend/src/core/ui/home.py**:
    - Defined `ProjectSessionItem`, `ProjectPageItem`, `ProjectSessionData`.
    - Defined `DocumentSessionItem`, `DocumentItem`, `DocumentSessionData`.
    - Registered `ProjectSessionManager` and `DocumentSessionManager` in `registed` dict.
2.  **backend/src/plugin/agent_manager/project_helper/plugin.py**:
    - Imported `ProjectSessionData`.
    - Updated `get_project_sessions` to use `ProjectSessionData` for type hinting and structure enforcement.
3.  **backend/src/plugin/agent_manager/document_helper/plugin.py**:
    - Imported `DocumentSessionData`.
    - Updated `get_document_sessions` to use `DocumentSessionData` for type hinting and structure enforcement.

## 验证方式与结果
- Verified that the new structures are correctly defined using `TypedDict`.
- Verified that the plugin methods return data matching these structures.
- Checked code syntax and imports.

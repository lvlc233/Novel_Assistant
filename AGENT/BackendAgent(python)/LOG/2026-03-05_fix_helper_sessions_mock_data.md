# Fix Helper Sessions Mock Data

**Date**: 2026-03-05
**Author**: BackendAgent(python)

## Objectives
- Update `get_project_sessions` in `ProjectHelper` to match `ProjectSessionManager` frontend component props.
- Update `get_document_sessions` in `DocumentHelper` to match `DocumentSessionManager` frontend component props.

## Changes

### `backend/src/plugin/agent_manager/project_helper/plugin.py`
- Updated `get_project_sessions` return data structure.
  - Changed `pages` items to include `name` and `sessions` list.
  - `sessions` items include `id`, `title`, `create_time`, `message_count`, `tokens`, `messages`.

### `backend/src/plugin/agent_manager/document_helper/plugin.py`
- Updated `get_document_sessions` return data structure.
  - Changed `documents` items to include `sessions` list.
  - `sessions` items include `id`, `title`, `create_time`, `message_count`, `tokens`, `messages`.

## Verification
- Checked frontend components `ProjectSessionManager.tsx` and `DocumentSessionManager.tsx` to ensure prop types match the returned JSON structure.

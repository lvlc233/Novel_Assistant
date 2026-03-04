# Implement Project and Document Helper Sessions

**Date**: 2026-03-05
**Author**: BackendAgent(python)

## Objectives
- Implement `get_project_sessions` in `ProjectHelper`.
- Implement `get_document_sessions` in `DocumentHelper`.
- Ensure operations target `Home.PluginDetails.Info`.
- Return mock data matching frontend requirements.

## Changes

### `backend/src/plugin/agent_manager/project_helper/plugin.py`
- Added `get_project_sessions` operation.
- Annotated with `@operation(ui_target=Home.PluginDetails.Info.filter())`.
- Returns mock data for `ProjectSessionManager`.

### `backend/src/plugin/agent_manager/document_helper/plugin.py`
- Imported `Home` from `core.ui.home`.
- Added `get_document_sessions` operation.
- Annotated with `@operation(ui_target=Home.PluginDetails.Info.filter())`.
- Returns mock data for `DocumentSessionManager`.

## Verification
- Code review of the changes ensures the contract is met.
- Mock data structure matches the provided JSON examples.

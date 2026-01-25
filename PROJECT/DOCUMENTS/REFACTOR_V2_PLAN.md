# Refactor V2 Plan: Plugin Architecture & Agent Orchestration

**Date**: 2026-01-25
**Status**: Planned
**Author**: MasterAgent

## 1. Introduction
This document outlines the plan for the second phase of refactoring ("Further Refactoring"), focusing on implementing the **Plugin Architecture** and **Agent Orchestration** as defined in the `Unified Technical Architecture v1.1`.

The current codebase has completed the initial structural refactoring (B1-B6), but lacks the core business logic for Plugins and advanced Agent interactions.

## 2. Objectives
1.  **Plugin System Implementation**:
    -   Backend: Database models, API endpoints, and runtime logic for registering and managing plugins.
    -   Frontend: UI for plugin management, configuration, and dynamic slot rendering.
2.  **Agent Orchestration**:
    -   Implement the `MasterAgent` as a router and state manager.
    -   Implement specific Sub-Agents (Novel, Document, Knowledge, etc.) as plugins or core modules.
    -   Ensure `LangGraph` is used for stateful, multi-turn agent interactions.
3.  **Work (Novel) Management**:
    -   Implement the "Work" concept which binds Plugins to specific projects (Novels).
    -   Database models for Works and Work-Plugin mappings.

## 3. Backend Tasks (Python/FastAPI)

### 3.1 Database Schema Updates
-   **New Tables**:
    -   `Plugin`: Registry of available plugins (System & Custom).
    -   `Work` (renamed/refactored from `Novel` if needed, or mapped): The core project entity.
    -   `WorkPluginMapping`: Configuration of plugins per work.
-   **Migration**: Ensure existing data (if any) is preserved or migrated.

### 3.2 Plugin Core Module
-   Create `src/core/plugins/`:
    -   `manager.py`: Logic to load/enable/disable plugins.
    -   `registry.py`: In-memory or DB-backed registry.
    -   `interface.py`: Abstract base classes for plugins.

### 3.3 API Endpoints
-   `POST /plugins`: Register/Update plugins.
-   `GET /plugins`: List available plugins.
-   `GET /works/{id}/plugins`: List plugins for a work.
-   `PATCH /works/{id}/plugins/{pid}`: Configure plugin for a work.

### 3.4 Agent Refactoring
-   **Master Agent**:
    -   Update `MasterGraph` to support dynamic sub-graph invocation based on user intent.
    -   Integrate with `Plugin` system to know which agents are available.
-   **Sub-Agents**:
    -   Refactor `kd_builder`, `novel` (composition) into proper sub-graphs.

## 4. Frontend Tasks (React/Next.js)

### 4.1 Plugin Management UI
-   **Plugin Marketplace/List**: View available plugins.
-   **Work Settings**: Toggle and configure plugins for a specific novel.

### 4.2 Dynamic UI Slots
-   Implement a "Slot" system where plugins can inject UI components (e.g., specific editor toolbars, sidebars).

### 4.3 Agent Chat Interface
-   Update Chat UI to support "Thread" based conversation history.
-   Render "Command" outputs from agents (e.g., "Draft Created", "Character Updated") using custom UI components.

## 5. Execution Steps

1.  **Backend**: DB Models & Plugin Registry (Priority High).
2.  **Backend**: Work Management APIs (Priority High).
3.  **Frontend**: Work & Plugin UI (Priority Medium).
4.  **Backend**: Master Agent Routing Logic (Priority Medium).
5.  **Integration**: Verify Plugin enable/disable affects Agent capabilities.

## 6. References
-   `PROJECT/DOCUMENTS/项目统一技术架构文档(重要).md` (v1.1)
-   `PROJECT/SPECIFICATION.md`

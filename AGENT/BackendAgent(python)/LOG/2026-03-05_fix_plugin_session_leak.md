# Plugin Service Session Leak Fix

**Time:** 2026年03月05日 06:45
**Target:** Fix `InterfaceError` caused by session/connection leaks in `invoke_plugin_operation`.
**Change Scope:** `backend/src/services/plugin/service.py`

**Details:**
1.  Introduced `cleanup_tasks` list to track resources that need explicit closure.
2.  Modified dependency injection loop to capture async generators (like `get_session`), start them, and schedule their `aclose` method in `cleanup_tasks`.
3.  Wrapped the plugin invocation result handling:
    *   If the result is an async generator (streaming response), it is wrapped in a new generator that executes `cleanup_tasks` in its `finally` block.
    *   If the result is a normal value or an error occurs, `cleanup_tasks` are executed immediately.
4.  Ensured correct order of execution: awaited coroutines first, then checked for async generators to support both direct generator returns and coroutine-wrapped generator returns.

**Verification:**
*   Code review confirms that all injected dependencies that are async generators will be closed either immediately (for non-streaming) or after the stream finishes (for streaming).
*   Exception handling ensures cleanup even on errors.

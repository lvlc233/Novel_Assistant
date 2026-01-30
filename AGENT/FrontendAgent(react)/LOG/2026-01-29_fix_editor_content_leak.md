# Frontend Change Log

## 2026-01-29 Fix Editor Content Leak

### Issue
When switching between chapters in the editor, the content of the previous chapter would sometimes persist in the new chapter view, especially if the new chapter was empty or loading. This was caused by the `TiptapEditor` component initializing with stale state from the parent `DocumentEditor` before the new chapter's content was fetched. The `TiptapEditor` only accepts external content updates when it is empty, so if it initialized with stale non-empty content, it would refuse to update to the correct content later.

### Fix
- Modified `DocumentEditor.tsx` to immediately reset `content` and `title` state to empty/default values whenever the current chapter is changed (via `onSelectChapter` or `handleCreateChapter`).
- This ensures that the `TiptapEditor` component (which re-mounts due to `key` change) always initializes with empty content.
- When the new chapter's content is subsequently fetched, `TiptapEditor` (now empty) correctly accepts the update.

### Verification
- **Scenario 1**: Switch from Chapter A (content "AAA") to Chapter B (content "BBB").
  - `content` reset to `''`. `TiptapEditor` mounts empty.
  - Fetch B -> `content` becomes "BBB".
  - `TiptapEditor` updates from empty to "BBB". (Success)
- **Scenario 2**: Switch from Chapter A to Chapter C (empty).
  - `content` reset to `''`. `TiptapEditor` mounts empty.
  - Fetch C -> `content` becomes `''`.
  - `TiptapEditor` stays empty. (Success)

### Files Changed
- `src/components/editor/DocumentEditor.tsx`

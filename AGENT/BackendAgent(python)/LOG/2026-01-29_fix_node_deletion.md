# Backend Change Log

## 2026-01-29 Fix Node Deletion

### Issue
Deleting a node (document) failed because associated `DocumentVersionSQLEntity` records were not being deleted, causing Foreign Key constraint violations or orphaned data.

### Fix
- Modified `delete_node` in `backend/src/services/node/service.py` to explicitly delete all `DocumentVersionSQLEntity` records associated with the node before deleting the node itself.

### Verification
- **Code Review**: Verified that `DocumentVersionSQLEntity` has a foreign key to `NodeSQLEntity` and `delete_node` now handles its cleanup.
- **Logic Check**: The deletion order is correct: Relationships -> Versions -> Node.

### Files Changed
- `backend/src/services/node/service.py`

# Update PG Client

## Time
2026-03-05 06:28

## Goal
Update `create_async_engine` call to include `pool_pre_ping=True`.

## Scope
- `backend/src/infrastructure/pg/pg_client.py`

## Verification
- Code review: checked the syntax of `create_async_engine`.

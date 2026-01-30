import asyncio
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Dict, Sequence, Tuple

import asyncpg
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
)

# SQL Definitions
INIT_SQL = """
CREATE TABLE IF NOT EXISTS checkpoints (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    parent_checkpoint_id TEXT,
    
    checkpoint_type TEXT NOT NULL,
    checkpoint_blob BYTEA NOT NULL,
    
    metadata_type TEXT NOT NULL,
    metadata_blob BYTEA NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_writes (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    idx INT NOT NULL,
    
    channel TEXT NOT NULL,
    type TEXT NOT NULL,
    blob BYTEA NOT NULL,
    
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);
"""

class PostgresCheckpointer(BaseCheckpointSaver):
    def __init__(self, conn_string: str, serde=None):
        super().__init__(serde=serde)
        self.conn_string = conn_string
        self.pool: asyncpg.Pool | None = None
        self._lock = asyncio.Lock()

    async def setup(self):
        """Initialize the database tables."""
        conn = await asyncpg.connect(self.conn_string)
        try:
            await conn.execute(INIT_SQL)
        finally:
            await conn.close()

    @asynccontextmanager
    async def connect(self):
        if self.pool is None:
            async with self._lock:
                if self.pool is None:
                    self.pool = await asyncpg.create_pool(self.conn_string)
        
        async with self.pool.acquire() as conn:
            yield conn
            
    async def close(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:

        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")

        async with self.connect() as conn:
            if checkpoint_id:
                row = await conn.fetchrow(
                    "SELECT checkpoint_type, checkpoint_blob, metadata_type, metadata_blob, parent_checkpoint_id FROM checkpoints "
                    "WHERE thread_id = $1 AND checkpoint_ns = $2 AND checkpoint_id = $3",
                    thread_id, checkpoint_ns, checkpoint_id,
                )
            else:
                row = await conn.fetchrow(
                    "SELECT checkpoint_type, checkpoint_blob, metadata_type, metadata_blob, parent_checkpoint_id, checkpoint_id FROM checkpoints "
                    "WHERE thread_id = $1 AND checkpoint_ns = $2 "
                    "ORDER BY checkpoint_id DESC LIMIT 1",
                    thread_id, checkpoint_ns,
                )
            
            if not row:
                return None
            
            if not checkpoint_id and "checkpoint_id" in row:
                checkpoint_id = row["checkpoint_id"]

            checkpoint = self.serde.loads_typed((row["checkpoint_type"], row["checkpoint_blob"]))
            metadata = self.serde.loads_typed((row["metadata_type"], row["metadata_blob"]))
            parent_checkpoint_id = row["parent_checkpoint_id"]
            
            # Fetch pending writes
            writes_rows = await conn.fetch(
                "SELECT task_id, channel, type, blob FROM checkpoint_writes "
                "WHERE thread_id = $1 AND checkpoint_ns = $2 AND checkpoint_id = $3",
                thread_id, checkpoint_ns, checkpoint_id,
            )
            
            pending_writes = [
                (row["task_id"], row["channel"], self.serde.loads_typed((row["type"], row["blob"])))
                for row in writes_rows
            ]

            return CheckpointTuple(
                config,
                checkpoint,
                metadata,
                (
                    {
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": checkpoint_ns,
                            "checkpoint_id": parent_checkpoint_id,
                        }
                    }
                    if parent_checkpoint_id
                    else None
                ),
                pending_writes=pending_writes
            )

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: Dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        
        query = "SELECT checkpoint_type, checkpoint_blob, metadata_type, metadata_blob, checkpoint_id, parent_checkpoint_id FROM checkpoints WHERE thread_id = $1 AND checkpoint_ns = $2"
        params = [thread_id, checkpoint_ns]
        
        if before:
            query += " AND checkpoint_id < $3"
            params.append(before["configurable"]["checkpoint_id"])
            
        query += " ORDER BY checkpoint_id DESC"
        
        if limit:
            query += f" LIMIT ${len(params) + 1}"
            params.append(limit)

        async with self.connect() as conn:
            rows = await conn.fetch(query, *params)
            for row in rows:
                checkpoint = self.serde.loads_typed((row["checkpoint_type"], row["checkpoint_blob"]))
                metadata = self.serde.loads_typed((row["metadata_type"], row["metadata_blob"]))
                
                # Check metadata filter
                if filter:
                    if not all(metadata.get(k) == v for k, v in filter.items()):
                        continue
                
                # TODO: Optimization - fetch writes in batch or lazy load?
                # For now, fetch writes for each checkpoint (might be slow for large lists)
                writes_rows = await conn.fetch(
                    "SELECT task_id, channel, type, blob FROM checkpoint_writes "
                    "WHERE thread_id = $1 AND checkpoint_ns = $2 AND checkpoint_id = $3",
                    thread_id, checkpoint_ns, row["checkpoint_id"],
                )
                
                pending_writes = [
                    (r["task_id"], r["channel"], self.serde.loads_typed((r["type"], r["blob"])))
                    for r in writes_rows
                ]
                    
                yield CheckpointTuple(
                    {
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": checkpoint_ns,
                            "checkpoint_id": row["checkpoint_id"],
                        }
                    },
                    checkpoint,
                    metadata,
                    (
                        {
                            "configurable": {
                                "thread_id": thread_id,
                                "checkpoint_ns": checkpoint_ns,
                                "checkpoint_id": row["parent_checkpoint_id"],
                            }
                        }
                        if row["parent_checkpoint_id"]
                        else None
                    ),
                    pending_writes=pending_writes
                )

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]
        parent_checkpoint_id = config["configurable"].get("checkpoint_id")
        
        # We store the full checkpoint without popping channel_values for simplicity in this MVP.
        # This avoids needing a separate blobs table and complexity of re-assembling.
        
        type_cp, blob_cp = self.serde.dumps_typed(checkpoint)
        type_md, blob_md = self.serde.dumps_typed(metadata)

        async with self.connect() as conn:
            await conn.execute(
                "INSERT INTO checkpoints (thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, checkpoint_type, checkpoint_blob, metadata_type, metadata_blob) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) "
                "ON CONFLICT (thread_id, checkpoint_ns, checkpoint_id) DO UPDATE SET "
                "checkpoint_type = EXCLUDED.checkpoint_type, "
                "checkpoint_blob = EXCLUDED.checkpoint_blob, "
                "metadata_type = EXCLUDED.metadata_type, "
                "metadata_blob = EXCLUDED.metadata_blob",
                thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id,
                type_cp, blob_cp, type_md, blob_md
            )
            
        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        }

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"]["checkpoint_id"]
        
        async with self.connect() as conn:
            async with conn.transaction():
                for idx, (channel, value) in enumerate(writes):
                    type_, blob = self.serde.dumps_typed(value)
                    await conn.execute(
                        "INSERT INTO checkpoint_writes (thread_id, checkpoint_ns, checkpoint_id, task_id, idx, channel, type, blob) "
                        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) "
                        "ON CONFLICT (thread_id, checkpoint_ns, checkpoint_id, task_id, idx) DO UPDATE SET "
                        "channel = EXCLUDED.channel, "
                        "type = EXCLUDED.type, "
                        "blob = EXCLUDED.blob",
                        thread_id, checkpoint_ns, checkpoint_id, task_id, idx,
                        channel, type_, blob
                    )

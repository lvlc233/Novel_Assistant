"""convert_core_enum_columns_to_string

Revision ID: a1b2c3d4e5f6
Revises: d2b1a3c6f7e1
Create Date: 2026-02-19 01:10:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "d2b1a3c6f7e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE work ALTER COLUMN work_type TYPE VARCHAR USING work_type::text")
    op.execute("ALTER TABLE work ALTER COLUMN state TYPE VARCHAR USING state::text")
    op.execute("ALTER TABLE node ALTER COLUMN node_type TYPE VARCHAR USING node_type::text")
    op.execute("ALTER TABLE memory ALTER COLUMN type TYPE VARCHAR USING type::text")

    op.execute("UPDATE work SET work_type = lower(work_type) WHERE work_type IS NOT NULL")
    op.execute("UPDATE work SET state = lower(state) WHERE state IS NOT NULL")
    op.execute("UPDATE node SET node_type = lower(node_type) WHERE node_type IS NOT NULL")
    op.execute("UPDATE memory SET type = lower(type) WHERE type IS NOT NULL")

    op.execute("DROP TYPE IF EXISTS worktypeenum")
    op.execute("DROP TYPE IF EXISTS workstateenum")
    op.execute("DROP TYPE IF EXISTS nodetypeenum")
    op.execute("DROP TYPE IF EXISTS memorytypeenum")


def downgrade() -> None:
    op.execute("CREATE TYPE worktypeenum AS ENUM ('novel')")
    op.execute("CREATE TYPE workstateenum AS ENUM ('updating', 'completed', 'hiatus')")
    op.execute("CREATE TYPE nodetypeenum AS ENUM ('folder', 'document')")
    op.execute("CREATE TYPE memorytypeenum AS ENUM ('long_term', 'short_term')")

    op.execute(
        "ALTER TABLE work ALTER COLUMN work_type TYPE worktypeenum USING work_type::worktypeenum"
    )
    op.execute(
        "ALTER TABLE work ALTER COLUMN state TYPE workstateenum USING state::workstateenum"
    )
    op.execute(
        "ALTER TABLE node ALTER COLUMN node_type TYPE nodetypeenum USING node_type::nodetypeenum"
    )
    op.execute(
        "ALTER TABLE memory ALTER COLUMN type TYPE memorytypeenum USING type::memorytypeenum"
    )

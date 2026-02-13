"""update_render_type_enum

Revision ID: f3a7b2c7c1c1
Revises: e7c3f0f2f4a1
Create Date: 2026-02-13 01:55:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "f3a7b2c7c1c1"
down_revision: Union[str, None] = "e7c3f0f2f4a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'rendertype' AND e.enumlabel = 'CONFIG'
            ) THEN
                ALTER TYPE rendertype ADD VALUE 'CONFIG';
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'rendertype' AND e.enumlabel = 'AGENT_MESSAGES'
            ) THEN
                ALTER TYPE rendertype ADD VALUE 'AGENT_MESSAGES';
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'rendertype' AND e.enumlabel = 'CARD'
            ) THEN
                ALTER TYPE rendertype ADD VALUE 'CARD';
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    pass

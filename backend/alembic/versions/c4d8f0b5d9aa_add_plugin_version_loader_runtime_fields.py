"""add_plugin_version_loader_runtime_fields

Revision ID: c4d8f0b5d9aa
Revises: f3a7b2c7c1c1
Create Date: 2026-02-18 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c4d8f0b5d9aa"
down_revision: Union[str, None] = "f3a7b2c7c1c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'loadertype'
            ) THEN
                CREATE TYPE loadertype AS ENUM ('url', 'json', 'internal');
            END IF;
        END $$;
        """
    )

    op.add_column(
        "plugin",
        sa.Column("version", sa.String(), nullable=False, server_default="1.0.0"),
    )
    op.add_column(
        "plugin",
        sa.Column("checksum", sa.String(), nullable=False, server_default=""),
    )
    op.add_column(
        "plugin",
        sa.Column(
            "loader_type",
            postgresql.ENUM("url", "json", "internal", name="loadertype", create_type=False),
            nullable=True,
        ),
    )
    op.add_column("plugin", sa.Column("runtime_config", sa.JSON(), nullable=True))
    op.add_column("plugin", sa.Column("plugin_operation_schema", sa.JSON(), nullable=True))

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name='plugin' AND column_name='config_schema'
            ) THEN
                UPDATE plugin
                SET runtime_config = config_schema
                WHERE runtime_config IS NULL;
            END IF;
        END $$;
        """
    )
    op.execute("UPDATE plugin SET runtime_config = '{}'::json WHERE runtime_config IS NULL")


def downgrade() -> None:
    op.drop_column("plugin", "plugin_operation_schema")
    op.drop_column("plugin", "runtime_config")
    op.drop_column("plugin", "loader_type")
    op.drop_column("plugin", "checksum")
    op.drop_column("plugin", "version")
    op.execute("DROP TYPE IF EXISTS loadertype")

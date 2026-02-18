"""convert_plugin_data_source_type_to_string

Revision ID: f7e8c9d0a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-02-19 01:20:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "f7e8c9d0a1b2"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE plugin ALTER COLUMN data_source_type TYPE VARCHAR USING data_source_type::text"
    )
    op.execute(
        "UPDATE plugin SET data_source_type = lower(data_source_type) WHERE data_source_type IS NOT NULL"
    )
    op.execute("DROP TYPE IF EXISTS datasourcetype")


def downgrade() -> None:
    op.execute("CREATE TYPE datasourcetype AS ENUM ('url', 'checkpoint', 'json', 'internal')")
    op.execute(
        "ALTER TABLE plugin ALTER COLUMN data_source_type TYPE datasourcetype USING data_source_type::datasourcetype"
    )

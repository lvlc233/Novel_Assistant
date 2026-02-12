"""add_plugin_data_source_type_config

Revision ID: b12f3a9c2d10
Revises: 9f5619e4eeef
Create Date: 2026-02-12 11:43:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b12f3a9c2d10"
down_revision: Union[str, None] = "9f5619e4eeef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    data_source_type_enum = sa.Enum("url", "checkpoint", "json", "internal", name="datasourcetype")
    data_source_type_enum.create(op.get_bind())

    op.add_column("plugin", sa.Column("data_source_type", data_source_type_enum, nullable=True))
    op.add_column("plugin", sa.Column("data_source_config", sa.JSON(), nullable=True))
    op.execute(
        "UPDATE plugin SET data_source_type='url', data_source_config=json_build_object('type','url','url',data_source_url) "
        "WHERE data_source_url IS NOT NULL AND data_source_type IS NULL"
    )


def downgrade() -> None:
    op.drop_column("plugin", "data_source_config")
    op.drop_column("plugin", "data_source_type")

    data_source_type_enum = sa.Enum("url", "checkpoint", "json", "internal", name="datasourcetype")
    data_source_type_enum.drop(op.get_bind())

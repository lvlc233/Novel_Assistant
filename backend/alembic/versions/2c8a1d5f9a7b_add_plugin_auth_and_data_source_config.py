"""add_plugin_auth_and_data_source_config

Revision ID: 2c8a1d5f9a7b
Revises: f7e8c9d0a1b2
Create Date: 2026-02-24 00:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "2c8a1d5f9a7b"
down_revision: Union[str, None] = "f7e8c9d0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("plugin")}
    if "auth_config" not in columns:
        op.add_column("plugin", sa.Column("auth_config", sa.JSON(), nullable=True))
    if "data_source_config" not in columns:
        op.add_column("plugin", sa.Column("data_source_config", sa.JSON(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("plugin")}
    if "data_source_config" in columns:
        op.drop_column("plugin", "data_source_config")
    if "auth_config" in columns:
        op.drop_column("plugin", "auth_config")

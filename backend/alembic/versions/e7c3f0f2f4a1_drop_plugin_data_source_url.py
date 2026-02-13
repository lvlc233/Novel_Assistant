"""drop_plugin_data_source_url

Revision ID: e7c3f0f2f4a1
Revises: b12f3a9c2d10
Create Date: 2026-02-12 12:28:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e7c3f0f2f4a1"
down_revision: Union[str, None] = "b12f3a9c2d10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("plugin", "data_source_url")


def downgrade() -> None:
    op.add_column("plugin", sa.Column("data_source_url", sa.String(), nullable=True))

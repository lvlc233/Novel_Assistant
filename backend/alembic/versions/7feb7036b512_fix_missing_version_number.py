"""fix_missing_version_number.

Revision ID: 7feb7036b512
Revises: 6feb7036b511
Create Date: 2026-01-29 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '7feb7036b512'
down_revision: Union[str, None] = '6feb7036b511'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('document_version', sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    op.drop_column('document_version', 'version_number')

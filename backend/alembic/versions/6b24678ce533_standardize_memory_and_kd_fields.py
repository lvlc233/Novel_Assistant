"""standardize_memory_and_kd_fields

Revision ID: 6b24678ce533
Revises: c46d736f982c
Create Date: 2026-03-08 16:23:52.837065

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes  # noqa: F401


# revision identifiers, used by Alembic.
revision: str = '6b24678ce533'
down_revision: Union[str, None] = 'c46d736f982c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # memory table
    op.rename_column('memory', 'name', 'title')
    op.rename_column('memory', 'context', 'content')
    op.add_column('memory', sa.Column('tags', sa.JSON(), nullable=True, server_default='[]'))
    
    # knowledge_chunk table
    op.rename_column('knowledge_chunk', 'context', 'content')


def downgrade() -> None:
    # knowledge_chunk table
    op.rename_column('knowledge_chunk', 'content', 'context')
    
    # memory table
    op.drop_column('memory', 'tags')
    op.rename_column('memory', 'content', 'context')
    op.rename_column('memory', 'title', 'name')

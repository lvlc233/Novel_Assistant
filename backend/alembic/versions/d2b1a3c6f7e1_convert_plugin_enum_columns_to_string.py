"""convert_plugin_enum_columns_to_string

Revision ID: d2b1a3c6f7e1
Revises: c4d8f0b5d9aa
Create Date: 2026-02-19 00:40:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "d2b1a3c6f7e1"
down_revision: Union[str, None] = "c4d8f0b5d9aa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE plugin ALTER COLUMN from_type TYPE VARCHAR USING from_type::text")
    op.execute("ALTER TABLE plugin ALTER COLUMN scope_type TYPE VARCHAR USING scope_type::text")
    op.execute("ALTER TABLE plugin ALTER COLUMN render_type TYPE VARCHAR USING render_type::text")
    op.execute("ALTER TABLE plugin ALTER COLUMN loader_type TYPE VARCHAR USING loader_type::text")
    op.execute("UPDATE plugin SET from_type = lower(from_type) WHERE from_type IS NOT NULL")
    op.execute("UPDATE plugin SET scope_type = lower(scope_type) WHERE scope_type IS NOT NULL")
    op.execute("UPDATE plugin SET loader_type = lower(loader_type) WHERE loader_type IS NOT NULL")
    op.execute("ALTER TABLE plugin ALTER COLUMN render_type DROP DEFAULT")
    op.execute("DROP TYPE IF EXISTS pluginfromtypeenum")
    op.execute("DROP TYPE IF EXISTS pluginscopetypeenum")
    op.execute("DROP TYPE IF EXISTS loadertype")
    op.execute("DROP TYPE IF EXISTS rendertype")
    op.execute("ALTER TABLE plugin ALTER COLUMN render_type SET DEFAULT 'CARD'")


def downgrade() -> None:
    op.execute("CREATE TYPE pluginfromtypeenum AS ENUM ('system', 'custom', 'official')")
    op.execute("CREATE TYPE pluginscopetypeenum AS ENUM ('global', 'work', 'document')")
    op.execute("CREATE TYPE loadertype AS ENUM ('url', 'json', 'internal')")
    op.execute("CREATE TYPE rendertype AS ENUM ('CONFIG', 'AGENT_MESSAGES', 'CARD', 'LIST', 'DETAIL', 'DASHBOARD')")
    op.execute(
        "ALTER TABLE plugin ALTER COLUMN from_type TYPE pluginfromtypeenum USING from_type::pluginfromtypeenum"
    )
    op.execute(
        "ALTER TABLE plugin ALTER COLUMN scope_type TYPE pluginscopetypeenum USING scope_type::pluginscopetypeenum"
    )
    op.execute(
        "ALTER TABLE plugin ALTER COLUMN render_type TYPE rendertype USING render_type::rendertype"
    )
    op.execute(
        "ALTER TABLE plugin ALTER COLUMN loader_type TYPE loadertype USING loader_type::loadertype"
    )

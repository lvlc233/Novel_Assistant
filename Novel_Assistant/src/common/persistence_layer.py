from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Dict, Any, List, Optional,Literal
from enum import Enum
from memory import SemanticMemory
from neo4j import GraphDatabase
from dataclasses import dataclass, field







from typing import Protocol

# 无需继承，结构匹配即可
class Logger(Protocol):
    def log(self, message: str) -> None: ...





class Model(Enum):
    SAVE   = "save"
    GET    = "get"
    UPDATE = "update"
    DELETE = "delete"

T = TypeVar("T")

# ---------- 1. 表定义 ----------
class Table(ABC):
    """每张关系表只负责拼 DDL 与字段清单"""
    name: str
    columns: Dict[str, str]          

# 长期记忆
class LongTermMemoryTable(Table):
    name = "long_term_memory_table"
    columns = {
        "id": "TEXT PRIMARY KEY",
        "long_term_memory": "TEXT",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
# 工作记忆
class WorkMemoryTable(Table):
    name = "work_memory_table"
    columns = {
        "id": "TEXT PRIMARY KEY",
        "session_id": "TEXT NOT NULL",
        "work_memory": "TEXT NOT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
# 短期记忆
class ShortTermMemoryTable(Table):
    name = "short_term_memory_table"
    columns = {
        "id": "TEXT PRIMARY KEY",
        "session_id": "TEXT NOT NULL",
        "short_term_memory": "TEXT NOT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
# 知识数据索引
class KDIndexTable(Table):
    name = "kd_index_table"
    columns = {
        "id": "TEXT PRIMARY KEY",
        "session_id": "TEXT NOT NULL",
        "kd_index": "TEXT NOT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
# 文档
class DocumentTable(Table):
    name = "document_table"
    columns = {
        "id": "TEXT PRIMARY KEY",
        "title": "TEXT",
        "mime": "TEXT",          # txt / docx
        "content": "TEXT",       # 超大文本
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "is_remove": "BOOLEAN DEFAULT FALSE"
    }

class DocumentVersionTable(Table):
    name = "document_version_table"
    columns = {
        "document_id": "TEXT",
        "version": "TEXT",
        "is_indexed":"BOOL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "is_remove": "BOOLEAN DEFAULT FALSE"
    }



# ---------- 2. 通用 Repo ----------
class RelationalRepo(ABC, Generic[T]):
    """一张表 = 一个 Repo 实例；CRUD 默认实现，驱动只拼 SQL"""
    def __init__(self, table: Table, client: "RelationalClient"):
        self.table = table
        self.client = client

    # 默认 CRUD，驱动可覆写性能/方言
    def save(self, obj: T) -> bool:
        return self.client.execute(Model.SAVE, self.table, obj)

    def get(self, _id: str) -> Optional[T]:
        return self.client.execute(Model.GET, self.table, _id)

    def update(self, obj: T) -> bool:
        return self.client.execute(Model.UPDATE, self.table, obj)

    def delete(self, _id: str) -> bool:
        return self.client.execute(Model.DELETE, self.table, _id)

# ---------- 3. 客户端接口 ----------
class RelationalClient(ABC):
    """驱动只需实现一个 execute + 一个 init_schema"""
    @abstractmethod
    def init_schema(self, tables: List[Table]) -> None:
        """建表/迁移"""

    @abstractmethod
    def execute(self, op: Model, table: Table, payload: Any = None) -> Any:
        """统一入口，内部用 if op==Model.SAVE: ... 即可"""



# SQLite 客户端
import sqlite3
from typing import Any, Optional
class SQLiteClient(RelationalClient):
    def __init__(self, conn_str: str = ":memory:"):
        self.conn = sqlite3.connect(conn_str, check_same_thread=False)

    def init_schema(self, tables: List[Table]):
        for t in tables:
            cols = ", ".join(f"{k} {v}" for k, v in t.columns.items())
            self.conn.execute(f"CREATE TABLE IF NOT EXISTS {t.name} ({cols})")

    def execute(self, op: Model, table: Table, payload: Any = None) -> Any:
        name = table.name
        if op == Model.SAVE:
            playload_copy=dict(payload)
            cols = list(playload_copy.keys())
            placeholders = ", ".join("?" for _ in cols)
            sql = f"INSERT OR REPLACE INTO {name} ({','.join(cols)}) VALUES ({placeholders})"
            self.conn.execute(sql, tuple(playload_copy[c] for c in cols))
            self.conn.commit()
            return True

        if op == Model.GET:
            cur = self.conn.execute(f"SELECT * FROM {name} WHERE id=?", (payload,))
            row = cur.fetchone()
            return row if row else None

        if op == Model.UPDATE:
            if not payload or "id" not in payload:
                raise ValueError("update need id in payload")

            payload_copy = dict(payload)          # 1. 浅拷贝
            _id = payload_copy.pop("id")          # 2. 再弹 id

            keys = list(payload_copy.keys())
            set_clause = ", ".join(f"{k}=?" for k in keys)
            sql = f"UPDATE {name} SET {set_clause} WHERE id=?"

            params = [payload_copy[k] for k in keys] + [_id]  # 3. 显式顺序
            self.conn.execute(sql, params)
            self.conn.commit()
            return True

        if op == Model.DELETE:
            self.conn.execute(f"DELETE FROM {name} WHERE id=?", (payload,))
            self.conn.commit()
            return True

# client=SQLiteClient(conn_str="db.db")
# client.init_schema([LongTermMemoryTable(),ShortTermMemoryTable()])
# mem = SemanticMemory(content="123")
# res=client.execute(Model.SAVE,LongTermMemoryTable,{"id":str(mem.memory_id),"long_term_memory":str({"semantic_memory":mem}),"created_at":str(mem.created_at)})
# res=client.execute(Model.GET,LongTermMemoryTable,str(mem.memory_id))
# print(res)
from typing import Any, List, Optional, Dict
import psycopg
from psycopg import sql



class PgClient(RelationalClient):
    def __init__(self, conn_str: str = "postgresql://user:password@localhost:5432/memdb"):
        # psycopg 3 支持“连接池”式写法，也可直接给 dsn
        self.conn = psycopg.connect(conn_str, autocommit=False)
        self._in_tx = False

    # ---------- 事务上下文 ----------
    def begin(self):
        if not self._in_tx:
            self.conn.execute("BEGIN")
            self._in_tx = True

    def commit(self):
        if self._in_tx:
            self.conn.commit()
            self._in_tx = False

    def rollback(self):
        if self._in_tx:
            self.conn.rollback()
            self._in_tx = False

    def __enter__(self):
        self.begin()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()

    # ---------- 建表 ----------
    def init_schema(self, tables: List[Table]) -> None:
        with self.conn.cursor() as cur:
            for t in tables:
                cols = [
                    sql.SQL("{} {}").format(sql.Identifier(k), sql.SQL(v))
                    for k, v in t.columns.items()
                ]
                stmt = sql.SQL("CREATE TABLE IF NOT EXISTS {} ({});").format(
                    sql.Identifier(t.name), sql.SQL(", ").join(cols)
                )
                cur.execute(stmt)
        self.conn.commit()

    # ---------- 统一 execute ----------
    def execute(self, op: Model, table: Table, payload: Any = None) -> Any:
        name = table.name
        if op == Model.SAVE:
            payload_copy = dict(payload)
            cols = list(payload_copy.keys())
            placeholders = ", ".join(["%s"] * len(cols))
            stmt = sql.SQL("INSERT INTO {} ({}) VALUES ({}) ON CONFLICT (id) DO UPDATE SET {}").format(
                sql.Identifier(name),
                sql.SQL(", ").join(map(sql.Identifier, cols)),
                sql.SQL(placeholders),
                sql.SQL(", ").join(
                    sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(k), sql.Identifier(k))
                    for k in cols
                )
            )
            with self.conn.cursor() as cur:
                cur.execute(stmt, tuple(payload_copy[c] for c in cols))
                self.conn.commit()
            return True

        if op == Model.GET:
            with self.conn.cursor() as cur:
                cur.execute(
                    sql.SQL("SELECT * FROM {} WHERE id = %s").format(sql.Identifier(name)),
                    (payload,)
                )
                row = cur.fetchone()
                return dict(row) if row else None

        if op == Model.UPDATE:
            if not payload or "id" not in payload:
                raise ValueError("update need id in payload")
            payload_copy = dict(payload)
            _id = payload_copy.pop("id")
            keys = list(payload_copy.keys())
            set_clause = sql.SQL(", ").join(
                sql.SQL("{} = %s").format(sql.Identifier(k)) for k in keys
            )
            stmt = sql.SQL("UPDATE {} SET {} WHERE id = %s").format(
                sql.Identifier(name), set_clause
            )
            with self.conn.cursor() as cur:
                cur.execute(stmt, tuple(payload_copy[k] for k in keys) + (_id,))
                self.conn.commit()
            return True

        if op == Model.DELETE:
            with self.conn.cursor() as cur:
                cur.execute(
                    sql.SQL("DELETE FROM {} WHERE id = %s").format(sql.Identifier(name)),
                    (payload,)
                )
                self.conn.commit()
            return True
@dataclass
class KGEntity:
    id:str=field(metadata={"description":"全局唯一id"})
    book_id:str=field(metadata={"description":"书id"})
    chapter_id:str=field(metadata={"description":"章节id"})
    version: str=field(metadata={"description":"版本号"})
    content: Any=field(metadata={"description":"核心内容"})
class Neo4jClient:
    def __init__(self, conn_str: str = "bolt://localhost:7687", auth: tuple = ("neo4j", "password")):
        self.conn = GraphDatabase.driver(conn_str, auth=auth)
        self._verify_connectivity()
        
    def _verify_connectivity(self):
        """验证数据库连接"""
        try:
            self.conn.verify_connectivity()
            print("✅ Neo4j连接成功")
        except Exception as e:
            print(f"❌ 连接失败: {e}")
            raise
    def init_schema(self):
        """初始化,建立索引"""
        with self.conn.session() as session:
            # 为实体创建唯一约束
            session.run("""
                CREATE CONSTRAINT id IF NOT EXISTS
                FOR (e:Entity) REQUIRE e.id IS UNIQUE
            """)
     
            session.run("""
                CREATE INDEX rel_chapter_version IF NOT EXISTS
                FOR ()-[r:chapter]-() ON (r.chapter_id, r.version)
            """)
            
            print("✅ Schema初始化完成")
    def execute(self):
        pass
   


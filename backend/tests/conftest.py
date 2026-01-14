import os
import pytest

# 在所有测试运行前设置环境变量
os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:password@localhost/dbname"

import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from src.infrastructure.pg.pg_client import async_session
from src.infrastructure.pg.pg_models import WorkTypeSQLEntity

async def init_work_types():
    async with async_session() as session:
        print("开始初始化作品类型数据...")
        
        # 1. 检查是否存在 'novel' 类型
        stmt = select(WorkTypeSQLEntity).where(WorkTypeSQLEntity.name == '小说')
        result = await session.execute(stmt)
        existing_novel = result.scalar_one_or_none()
        
        if existing_novel:
            print("发现已存在的 '小说' 类型，正在更新...")
            existing_novel.tags = ["folder", "document"]
            existing_novel.relationship = [{"folder": "document"}]
        else:
            print("未找到 '小说' 类型，正在创建...")
            new_novel = WorkTypeSQLEntity(
                id=uuid.uuid4(),
                name="小说",
                tags=["folder", "document"],
                relationship=[{"folder": "document"}]
            )
            session.add(new_novel)
            
        await session.commit()
        print("作品类型数据初始化完成！")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(init_work_types())

from datetime import datetime,timezone
from typing import List,Union
from common.clients.pg.pg_models import (
    NovelSQLEntity, 
    FolderSQLEntity,
    DocumentVersionSQLEntity,
    DocumentSQLEntity
)
from core.domain.models import NovelDomain,FolderEntity,TableOfContentsEntity
from api.models import (
    NovelAbbreviateResponse,
    NovelDetailResponse,
    FolderItemInAPI,
    DocumentItemInAPI
)
class NovelAdapter:
    """小说适配器."""
    @staticmethod
    def to_domain(
        novel_entity: NovelSQLEntity,
        table_of_contents:List[Union[FolderEntity, TableOfContentsEntity]]=[]
    ) -> NovelDomain:
        """将数据库实体转换为领域模型.
            Args:
                NovelSQLEntity: 小说数据库实体
                List[Union[FolderEntity, TableOfContentsEntity]]: 目录项列表
            Returns:
                NovelDomain: 小说领域模型
        """
        return NovelDomain(
            novel_id=novel_entity.novel_id,
            user_id=novel_entity.user_id,
            image_url=novel_entity.image_url,
            novel_name=novel_entity.name,
            summary=novel_entity.description,
            state=novel_entity.state,
            create_time=novel_entity.create_time.isoformat(),
            update_time=novel_entity.update_time.isoformat(),
            hiatus_interval=(datetime.now(timezone.utc) - novel_entity.update_time).days,
            table_of_contents=table_of_contents
        )

    def from_domain_abbreviate(novel_domain: NovelDomain) -> NovelAbbreviateResponse:
        """将领域模型转换为数据库实体.
            Args:
                NovelDomain: 小说领域模型
            Returns:
                NovelIdResponse: 小说ID响应模型
        """
        return NovelAbbreviateResponse(
            novel_id=novel_domain.novel_id,
            image_url=novel_domain.image_url,
            novel_name=novel_domain.novel_name,
            summary=novel_domain.summary,
            state=novel_domain.state,
            create_time=novel_domain.create_time,
            update_time=novel_domain.update_time,
            hiatus_interval=novel_domain.hiatus_interval,
        )
    @staticmethod
    def from_domain_detail(novel_domain: NovelDomain) -> NovelDetailResponse:
        """将领域模型转换为数据库实体.
            Args:
                NovelDomain: 小说领域模型
            Returns:
                NovelDetailResponse: 小说详情响应模型
        """
        menu = []
        for item in novel_domain.table_of_contents:
            if isinstance(item, FolderEntity):
                menu.append(FolderAdapter.from_domain(item))
            elif isinstance(item, TableOfContentsEntity):
                menu.append(TableOfContentsEntityAdapter.from_domain(item))

        return NovelDetailResponse(
            novel_id=novel_domain.novel_id,
            image_url=novel_domain.image_url,
            novel_name=novel_domain.novel_name,
            summary=novel_domain.summary,
            state=novel_domain.state,
            create_time=novel_domain.create_time,
            update_time=novel_domain.update_time,
            hiatus_interval=novel_domain.hiatus_interval,
            menu=menu
        )
class FolderAdapter:
    """文件夹适配器."""
    @staticmethod
    def to_domain(folder_entity: FolderSQLEntity,table_of_contents:List[TableOfContentsEntity]=[]) -> FolderEntity:
        """将数据库实体转换为领域模型.
            Args:
                FolderSQLEntity: 文件夹数据库实体
                List[TableOfContentsEntity]: 目录项列表
            Returns:
                FolderEntity: 文件夹领域模型
        """
        return FolderEntity(
            folder_id=folder_entity.folder_id,
            folder_name=folder_entity.name,
            create_time=folder_entity.create_time.isoformat(),
            table_of_contents=table_of_contents
        )

    @staticmethod
    def from_domain(folder_entity: FolderEntity) -> FolderItemInAPI:
        """将领域模型转换为API模型."""
        return FolderItemInAPI(
            folder_name=folder_entity.folder_name,
            document_list=[
                TableOfContentsEntityAdapter.from_domain(item) 
                for item in folder_entity.table_of_contents
            ]
        )

class TableOfContentsEntityAdapter:
    """目录项适配器."""
    @staticmethod
    def to_domain(chapter:DocumentSQLEntity,dvs_entities: List[DocumentVersionSQLEntity]) -> TableOfContentsEntity:
        """将数据库实体转换为领域模型.
            Args:
                DocumentVersionSQLEntity: 目录项数据库实体
                DocumentSQLEntity: 章节数据库实体
            Returns:
                TableOfContentsEntity: 目录项领域模型
        """
        return TableOfContentsEntity(
            chapter_id=chapter.doc_id,
            chapter_name=chapter.title,
            chapter_current_version=chapter.current_version_id,
            chapter_version_list=[dvs_entity.version_id for dvs_entity in dvs_entities]
        )

    @staticmethod
    def from_domain(entity: TableOfContentsEntity) -> DocumentItemInAPI:
        """将领域模型转换为API模型."""
        return DocumentItemInAPI(
            document_name=entity.chapter_name,
            current_version=entity.chapter_current_version,
            document_version_list=entity.chapter_version_list 
        )
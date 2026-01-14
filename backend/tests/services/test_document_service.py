import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from services.document_service import get_document_detail_use_document_id_and_version_id4service, DocumentDetailPinnedVersion
from types import SimpleNamespace

@pytest.mark.anyio
async def test_get_document_detail_success():
    """测试成功获取指定版本的文档详情"""
    mock_session = AsyncMock(spec=AsyncSession)
    
    # 模拟数据
    doc_id = "doc_123"
    version_id = "v_1"
    
    # 模拟 DocumentSQLEntity
    # 使用 SimpleNamespace 模拟对象，它自带 __dict__
    mock_document = SimpleNamespace(
        doc_id=doc_id,
        title="Test Document",
        novel_id="novel_123",
        some_other_field="ignored"
    )
    
    # 模拟 DocumentVersionSQLEntity
    mock_version = SimpleNamespace(
        version_id=version_id,
        doc_id=doc_id,
        body_text="This is content",
        word_count=100,
        create_time="2023-01-01"
    )

    # Patch PGClient
    with patch("services.document_service.PGClient") as MockPGClient:
        mock_client_instance = MockPGClient.return_value
        
        # 设置返回值
        mock_client_instance.get_document_version_by_doc_id_and_version_id.return_value = mock_version
        mock_client_instance.get_document_by_doc_id.return_value = mock_document
        
        # 执行测试
        result = await get_document_detail_use_document_id_and_version_id4service(doc_id, version_id, mock_session)
        
        # 验证结果类型
        assert isinstance(result, DocumentDetailPinnedVersion)
        
        # 验证合并后的字段
        assert result.doc_id == doc_id
        assert result.version_id == version_id
        assert result.title == "Test Document"
        assert result.body_text == "This is content"
        assert result.word_count == 100

@pytest.mark.anyio
async def test_get_document_detail_not_found():
    """测试文档或版本不存在的情况（预期抛出 AttributeError，因为当前实现未处理 None）"""
    mock_session = AsyncMock(spec=AsyncSession)
    doc_id = "doc_404"
    version_id = "v_404"
    
    with patch("services.document_service.PGClient") as MockPGClient:
        mock_client_instance = MockPGClient.return_value
        
        # 模拟返回 None
        mock_client_instance.get_document_version_by_doc_id_and_version_id.return_value = None
        mock_client_instance.get_document_by_doc_id.return_value = None
        
        # 预期会抛出 AttributeError: 'NoneType' object has no attribute '__dict__'
        with pytest.raises(AttributeError):
            await get_document_detail_use_document_id_and_version_id4service(doc_id, version_id, mock_session)

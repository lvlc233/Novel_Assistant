import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timedelta
from services.novel_service import get_novel_directory4service, get_novel_detail4service
from core.domain.models import DirectoryNode, NovelDetailDomain
from common.utils import get_now_time

@pytest.mark.anyio
async def test_get_novel_directory_structure():
    """Test fetching novel directory structure with sorting and mocking"""
    novel_id = "novel_test_dir"
    mock_session = AsyncMock()

    # Mock Data Construction
    # Tree items
    # Folder 1 (Sort 1)
    tree_folder = MagicMock()
    tree_folder.node_id = "folder_a"
    tree_folder.node_type = "folder"
    tree_folder.node_sort_order = 1
    tree_folder.parent_id = None
    
    # Doc 1 (Sort 0, Root) - Sort order is lower than folder, but should come AFTER folder due to type sorting
    tree_doc_root = MagicMock()
    tree_doc_root.node_id = "doc_b"
    tree_doc_root.node_type = "document"
    tree_doc_root.node_sort_order = 0
    tree_doc_root.parent_id = None

    # Doc 2 (Sort 1, Inside Folder 1)
    tree_doc_child = MagicMock()
    tree_doc_child.node_id = "doc_c"
    tree_doc_child.node_type = "document"
    tree_doc_child.node_sort_order = 1
    tree_doc_child.parent_id = "folder_a"

    tree_items = [tree_folder, tree_doc_root, tree_doc_child]

    # Folder Map
    folder_a = MagicMock()
    folder_a.folder_name = "Chapter 1"
    folder_a.folder_create_time = datetime(2023, 1, 1, 10, 0, 0)
    folder_map = {"folder_a": folder_a}

    # Doc Map
    doc_b_meta = MagicMock()
    doc_b_meta.document_title = "Prologue"
    doc_b_meta.document_update_time = datetime(2023, 1, 2, 10, 0, 0)
    
    doc_c_meta = MagicMock()
    doc_c_meta.document_title = "Section 1.1"
    doc_c_meta.document_update_time = datetime(2023, 1, 3, 10, 0, 0)

    doc_map = {
        "doc_b": (doc_b_meta, 1000),
        "doc_c": (doc_c_meta, 500)
    }

    # Patch PGClient
    with patch("services.novel_service.PGClient") as MockPGClient:
        instance = MockPGClient.return_value
        instance.get_novel_directory_elements = AsyncMock(return_value=(tree_items, folder_map, doc_map))
        
        # Execute
        directory = await get_novel_directory4service(novel_id, mock_session)
        
        # Assertions
        assert len(directory) == 2
        
        # Verify Folder A is first
        item1 = directory[0]
        assert item1.node_id == "folder_a"
        assert item1.node_type == "folder"
        assert item1.node_name == "Chapter 1"
        assert len(item1.children) == 1
        
        # Verify Child Doc
        child = item1.children[0]
        assert child.node_id == "doc_c"
        assert child.node_name == "Section 1.1"
        assert child.word_count == 500
        
        # Verify Root Doc is second
        item2 = directory[1]
        assert item2.node_id == "doc_b"
        assert item2.node_name == "Prologue"
        assert item2.word_count == 1000

@pytest.mark.anyio
async def test_get_novel_detail():
    """Test fetching novel detail with mocked dependencies"""
    novel_id = "novel_test_detail"
    mock_session = AsyncMock()
    
    # Mock Novel Entity
    mock_novel = MagicMock()
    mock_novel.novel_id = novel_id
    mock_novel.novel_name = "My Novel"
    mock_novel.novel_cover_image_url = "http://img.com/1.jpg"
    mock_novel.novel_summary = "A great story"
    mock_novel.novel_state = "ongoing"
    mock_novel.novel_create_time = datetime(2023, 1, 1)
    mock_novel.novel_update_time = get_now_time() - timedelta(days=5) # 5 days ago
    
    # Mock Word Count
    mock_word_count = 5000
    
    # Mock Directory (Simplified)
    mock_directory = [
        DirectoryNode(node_id="n1", node_name="f1", node_type="folder", sort_order=1)
    ]

    # Patch PGClient and the internal call to get_novel_directory4service if we want to isolate detail logic
    # But get_novel_detail4service calls get_novel_directory4service directly.
    # We can either mock get_novel_directory4service OR mock the PGClient methods it calls.
    # Let's mock PGClient completely for consistency.
    
    with patch("services.novel_service.PGClient") as MockPGClient:
        instance = MockPGClient.return_value
        instance.get_novel_by_id = AsyncMock(return_value=mock_novel)
        instance.get_novel_word_count = AsyncMock(return_value=mock_word_count)
        
        # We also need to mock get_novel_directory_elements because get_novel_detail4service calls get_novel_directory4service
        # which creates a NEW PGClient instance (or uses the same one if we are lucky with how patch works).
        # Wait, get_novel_detail4service does:
        # pg_client = PGClient(session)
        # ...
        # directory = await get_novel_directory4service(novel_id, session)
        
        # And get_novel_directory4service does:
        # pg_client = PGClient(session)
        
        # Since we patch the CLASS, both instantiations return the SAME mock instance (or new instances of the Mock class).
        # We need to ensure get_novel_directory4service returns what we want.
        # It's easier to patch 'services.novel_service.get_novel_directory4service' directly 
        # to avoid setting up the complex tree mock data again.
        
        with patch("services.novel_service.get_novel_directory4service", new_callable=AsyncMock) as mock_get_dir:
            mock_get_dir.return_value = mock_directory
            
            detail = await get_novel_detail4service(novel_id, mock_session)
            
            assert detail.novel_id == novel_id
            assert detail.novel_name == "My Novel"
            assert detail.novel_word_count == 5000
            assert detail.novel_hiatus_interval == 5
            assert len(detail.directory) == 1
            assert detail.directory[0].node_id == "n1"

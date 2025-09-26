"""
基于RecursiveCharacterTextSplitter的章节文档切割器
支持按章节格式切割文档，并保留章节信息和行号
"""

import re
from typing import List, Dict
from langchain_core.documents import Document


class ChapterTextSplitter:
    """按章节切割文档的文本分割器"""
    
    def __init__(self, 
                 chapter_pattern: str = r'^第\d+章\s+.+$'):
        """
        初始化章节文本分割器
        
        Args:
            chapter_pattern: 章节标题的正则表达式模式
        """
        self.chapter_pattern = chapter_pattern
     # 查找所有章节(行号标记)
    def _find_chapters(self, text: str) -> List[Dict]:
        """
        查找文档中的所有章节
        Args:
            text: 文档文本内容
            
        Returns:
            章节信息列表，包含章节标题、起始行号、结束行号等
        """
        lines = text.split('\n')
        chapters = []
        
        for i, line in enumerate(lines, 1):
            # 起始位置
            if re.match(self.chapter_pattern, line.strip()):
                chapters.append({
                    'title': line.strip(),
                    'start_line': i,
                    'content_start_line': i + 1
                })
        
        # 设置每个章节的结束行号
        for i in range(len(chapters)):
            if i < len(chapters) - 1:
                chapters[i]['end_line'] = chapters[i + 1]['start_line'] - 1
            else:
                chapters[i]['end_line'] = len(lines)
        
        return chapters
    
    # 内容提取
    def _extract_chapter_content(self, text: str, chapter_info: Dict) -> str:
        """
        提取指定章节的内容
        
        Args:
            text: 完整文档文本
            chapter_info: 章节信息字典
            
        Returns:
            章节内容文本
        """
        lines = text.split('\n')
        start_idx = chapter_info['start_line']
        end_idx = chapter_info['end_line']
        
        chapter_lines = lines[start_idx:end_idx]
        return '\n'.join(chapter_lines)
    
    def split_by_chapters(self, file_path: str) -> List[Dict]:
        """
        按章节切割文档
        
        Args:
            file_path: 文档文件路径
            
        Returns:
            切割后的文档块列表，每个块包含内容、元数据等信息
        """
        # 读取文档内容
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # 查找所有章节
        chapters = self._find_chapters(text)
        
        # 按章节处理
        all_chunks = []
        
        for chapter_info in chapters:
            # 提取章节内容
            chapter_content = self._extract_chapter_content(text, chapter_info)
            
            # 如果章节内容为空，跳过
            if not chapter_content.strip():
                continue
    
            # 为每个块添加元数据
          
            chunk_info = {
                'content': chapter_content,
                'metadata': {
                    'chapter_title': chapter_info['title']
                }
            }
            all_chunks.append(chunk_info)
        
        return all_chunks

    def to_docment(self, chunks: List[Dict]) -> List[Document]:
        """
        将切割后的块转换为 Document 类型
        
        Args:
            chunks: 切割后的文档块列表，每个块包含内容和元数据
            
        Returns:
            Document 类型的文档对象列表
        """
        return [Document(
            page_content=chunk['content'],
            metadata=chunk['metadata']
        ) for chunk in chunks]

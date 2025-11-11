"""
配置加载器

提供YAML配置文件的加载
"""
import logging
from tkinter import N
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime


class LoadError(Exception):
    """配置加载异常"""
    pass


class ConfigLoader:
    """配置加载器
    
    负责加载YAML配置文件
    """
    def __init__(self, config_dir: Optional[str] = None):
        """初始化配置加载器
        
        Args:
            config_dir: 配置文件目录，默认为项目根目录下的config文件夹
        """
        if config_dir is None:
            # 默认配置目录：项目根目录/config
            project_root = Path(__file__).parent.parent.parent.parent
            config_dir = project_root / "config"
        
        self.config_dir = Path(config_dir)
        print
        # 确保配置目录存在
        if not self.config_dir.exists():
            raise LoadError(f"配置目录不存在: {self.config_dir}")
    
    def _get_config_file_path(self, filename: str) -> Path:

        """获取配置文件完整路径"""
        if not filename.endswith('.yaml') and not filename.endswith('.yml'):
            filename += '.yaml'
        return self.config_dir / filename
    
    def _load_yaml_file(self, file_path: Path) -> Dict[str, Any]:
        """加载YAML文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
                if content is None:
                    return {}
                return content
        except FileNotFoundError:
            raise LoadError(f"配置文件不存在: {file_path}")
        except yaml.YAMLError as e:
            raise LoadError(f"YAML文件解析错误: {e}")
        except Exception as e:
            raise LoadError(f"加载配置文件失败: path={file_path}, type={type(e).__name__}, err={e}")
    
    def load_config(self,  filename: str|None = None) -> Any:...

    def validate_config_file(self, filename: str|None ) -> bool:
        """验证配置文件格式是否正确
        
        Args:
            filename: 配置文件名
            
        Returns:
            bool: 验证是否通过
        """
        try:
            self.load_config(filename)
            return True
        except LoadError:
            return False
    
    def get_config_info(self, filename: str) -> Dict[str, Any]:
        """获取配置文件信息
        
        Args:
            filename: 配置文件名
            
        Returns:
            Dict: 配置文件信息
        """
        file_path = self._get_config_file_path(filename)
        
        if not file_path.exists():
            return {"exists": False}
        
        stat = file_path.stat()
        return {
            "exists": True,
            "path": str(file_path),
            "size": stat.st_size,
            "modified_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }
    
    def list_config_files(self) -> list[str]:
        """列出配置目录中的所有YAML文件"""
        if not self.config_dir.exists():
            return []
        
        yaml_files = []
        for file_path in self.config_dir.glob("*.yaml"):
            yaml_files.append(file_path.stem)
        for file_path in self.config_dir.glob("*.yml"):
            yaml_files.append(file_path.stem)
        
        return sorted(yaml_files)

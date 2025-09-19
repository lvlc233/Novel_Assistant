import time
import threading
from typing import Optional


class SnowflakeIDGenerator:
    """
    基于雪花序列的ID生成器
    
    雪花算法生成64位ID结构:
    - 1位符号位(固定为0)
    - 41位时间戳(毫秒级)
    - 10位机器ID(5位数据中心ID + 5位机器ID)
    - 12位序列号(同一毫秒内的序列)
    """
    
    def __init__(self, datacenter_id: int = 1, machine_id: int = 1):
        """
        初始化雪花ID生成器
        
        Args:
            datacenter_id: 数据中心ID (0-31)
            machine_id: 机器ID (0-31)
        """
        # 验证参数范围
        if not (0 <= datacenter_id <= 31):
            raise ValueError("datacenter_id must be between 0 and 31")
        if not (0 <= machine_id <= 31):
            raise ValueError("machine_id must be between 0 and 31")
        
        # 时间戳起始点 (2023-01-01 00:00:00 UTC)
        self.epoch = 1672531200000
        
        # 各部分位数
        self.datacenter_id_bits = 5
        self.machine_id_bits = 5
        self.sequence_bits = 12
        
        # 最大值
        self.max_datacenter_id = (1 << self.datacenter_id_bits) - 1
        self.max_machine_id = (1 << self.machine_id_bits) - 1
        self.max_sequence = (1 << self.sequence_bits) - 1
        
        # 位移量
        self.machine_id_shift = self.sequence_bits
        self.datacenter_id_shift = self.sequence_bits + self.machine_id_bits
        self.timestamp_shift = self.sequence_bits + self.machine_id_bits + self.datacenter_id_bits
        
        # 实例变量
        self.datacenter_id = datacenter_id
        self.machine_id = machine_id
        self.sequence = 0
        self.last_timestamp = -1
        
        # 线程锁
        self.lock = threading.Lock()
    
    def _current_timestamp(self) -> int:
        """获取当前时间戳(毫秒)"""
        return int(time.time() * 1000)
    
    def _wait_next_millis(self, last_timestamp: int) -> int:
        """等待下一毫秒"""
        timestamp = self._current_timestamp()
        while timestamp <= last_timestamp:
            timestamp = self._current_timestamp()
        return timestamp
    
    def generate_id(self) -> int:
        """
        生成雪花ID
        
        Returns:
            int: 64位雪花ID
        """
        with self.lock:
            timestamp = self._current_timestamp()
            
            # 时间回拨检查
            if timestamp < self.last_timestamp:
                raise RuntimeError(
                    f"Clock moved backwards. Refusing to generate id for "
                    f"{self.last_timestamp - timestamp} milliseconds"
                )
            
            # 同一毫秒内
            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & self.max_sequence
                # 序列号溢出，等待下一毫秒
                if self.sequence == 0:
                    timestamp = self._wait_next_millis(self.last_timestamp)
            else:
                # 新的毫秒，序列号重置
                self.sequence = 0
            
            self.last_timestamp = timestamp
            
            # 组装ID
            snowflake_id = (
                ((timestamp - self.epoch) << self.timestamp_shift) |
                (self.datacenter_id << self.datacenter_id_shift) |
                (self.machine_id << self.machine_id_shift) |
                self.sequence
            )
            
            return snowflake_id
    
    def parse_id(self, snowflake_id: int) -> dict:
        """
        解析雪花ID
        
        Args:
            snowflake_id: 雪花ID
            
        Returns:
            dict: 包含时间戳、数据中心ID、机器ID、序列号的字典
        """
        # 提取各部分
        sequence = snowflake_id & self.max_sequence
        machine_id = (snowflake_id >> self.machine_id_shift) & self.max_machine_id
        datacenter_id = (snowflake_id >> self.datacenter_id_shift) & self.max_datacenter_id
        timestamp = (snowflake_id >> self.timestamp_shift) + self.epoch
        
        return {
            'timestamp': timestamp,
            'datetime': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp / 1000)),
            'datacenter_id': datacenter_id,
            'machine_id': machine_id,
            'sequence': sequence
        }
    
    def generate_string_id(self) -> str:
        """
        生成字符串格式的雪花ID
        
        Returns:
            str: 字符串格式的雪花ID
        """
        return str(self.generate_id())


# 全局默认实例
_default_generator: Optional[SnowflakeIDGenerator] = None


def get_default_generator() -> SnowflakeIDGenerator:
    """
    获取默认的雪花ID生成器实例
    
    Returns:
        SnowflakeIDGenerator: 默认生成器实例
    """
    global _default_generator
    if _default_generator is None:
        _default_generator = SnowflakeIDGenerator()
    return _default_generator


def generate_id() -> int:
    """
    使用默认生成器生成雪花ID
    
    Returns:
        int: 雪花ID
    """
    return get_default_generator().generate_id()


def generate_string_id() -> str:
    """
    使用默认生成器生成字符串格式的雪花ID
    
    Returns:
        str: 字符串格式的雪花ID
    """
    return get_default_generator().generate_string_id()


def parse_id(snowflake_id: int) -> dict:
    """
    使用默认生成器解析雪花ID
    
    Args:
        snowflake_id: 雪花ID
        
    Returns:
        dict: 解析结果
    """
    return get_default_generator().parse_id(snowflake_id)



from dataclasses import dataclass,field
from common.context import Context


@dataclass
class FacadeAgentState():
    """
    门面代理状态
    """
    context: Context = field(default_factory=Context)
    user_input: str = ""

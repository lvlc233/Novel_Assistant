"""
提示词优化建议
    短推导省略:当你使用一个抽象概念并做出概念的解释时,请省略掉抽象的概念直接给出详细的解释说明
        例如: 提取上下文中的人物关系,人物关系包括,家族,地位,关系等--->提取上下文中人物之间的家庭,地位等关系
"""

ATTENTION_READ_PROMPT="""
    阅读下面的小说片段,
    逐句的阅读,
    你将作为读者,关注有价值的内容,可以一句话,或者一个词,一个概念等等,也包括这些内容的细节补充。
    在阅读时候你会将这些内容更加具有印象。
    如果你的新阅读的句子中涉及了印象中的内容,他们被认为可能是重要的,分析他们是其他内容,还是该内容的细节补充。
    
    [当前印象]:{impression}
    [当前阅读]:{sentence}

    输出: 输出当前阅读后,仅输出对该段落的印象,并给出你的理由
"""
ATOM_SUBMIT_PROMPT="""
    阅读下面的段落,提取出其中表示为原子实体概念的所有内容。

    当前我们所处原子层:原子层是整个知识图谱构建流程的基石，
    其核心任务是识别并提取文本中那些不依赖于其他实体即可独立存在的"原子"概念。 
    这些概念构成了知识图谱中最基础的节点，是后续所有复杂实体和关系构建的出发点。
    实体概念:
        角色:
            具体人物、虚构角色或具有特定身份标识的个体
            示例：爱因斯坦、孙悟空、项目经理
        地点:
            地理上的位置，可以是国家、城市、具体地址或虚构场景
            示例：中国、北京市、霍格沃茨魔法学校
        时间
            具体的时间点、日期、时间段或具有时间属性的描述
            示例：2025年11月11日、上世纪90年代
        组织
            由多人组成的团体、机构、公司或政府实体
            示例：联合国、微软公司、清华大学
    
    如果段落中没有实体概念,则输出空列表。
    
    段落:[{content}]
"""
DEPENDENCE_SUBMIT_PROMPT="""
    阅读下面的段落,提取出其中表示为依赖实体概念的所有内容。

    依赖层的任务是识别和提取那些无法独立存在、 
    必须依附于一个或多个原子实体的复杂概念，
    即"依赖实体"。
    这些实体通常代表了更高层次的语义单元， 如事件、技能、物品等。
    
    事件:
        在特定时间、地点发生，并由角色或组织参与的活动
    技能:
        个人或组织所具备的特定能力、技术或专业知识
    物品:
        具体的、可被创造、拥有或交易的实体物品或虚拟产品


    段落:[{content}]
"""
COMPLETE_KD_PROMPT="""
    你阅读完成了所有的段落,接下来你将回顾所有的印象,并根据你印象构建知识图谱。
    你的关注点在于:[注意]{attention}[注意]
    你阅读以下的文章
    {document}
    并根据你注意到的实体补全他们的属性和关系
    不依赖于其他实体的基础实体,[原子实体]{atom}[原子实体]
    依赖于其他实体的复杂实体,[依赖实体]{depend}[依赖实体]

"""
CYPHER_BUILD_PROMPT="""
    你将根据以下的知识图谱节点,关系,构建对应的Cypher语句。
    并根据实际依赖情况,重新对节点进行分析,分析那些节点应该为属性,那些应该确实为实体。
    | 判断维度      | 实体（Entity） | 属性（Attribute） |
    | --------- | ---------- | ------------- |
    | **独立性**   | 可独立存在，有意义  | 必须依附于实体才有意义   |
    | **复用性**   | 被多个实体引用或关联 | 只描述单个实体       |
    | **关系性**   | 会与其他实体发生关系 | 不参与关系构建       |
    | **可检索性**  | 用户可能会单独搜索它 | 用户不会单独搜索它     |
    | **结构复杂性** | 有内部结构或子属性  | 仅为键值对         |

    节点:{full_node}
    关系:{relation}
"""


from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder


#
Context_to_System_Prompt="""
与此同时你记得
<长期记忆>{long_mem}</长期记忆>
<工作记忆>{work_mem}</工作记忆>
并搜索到
<知识数据>{knowledge_data}</知识数据>
"""


def Facade_Agent_Prompt_Template()->ChatPromptTemplate:
    """
        门面Agent的完整提示词模板:
        context_system:上下文系统提示词,包含了上下文的长期记忆,工作记忆,知识数据等
        history:上下文的历史记录,包含了用户的输入和Agent的输出
        input:用户的输入
        ---
         ("system", ""
            你,小说家,现在来了一名新的小说家,你将作为副笔和他一同进行小说创作;
            你,了解你还记得什么,不记得什么;当你在<长期记忆>,<工作记忆>和<历史记录>中都找不到相关的信息时,说明你忘记了;
            当你忘记时,或许<知识数据>中会有相关数据;
            当你忘记时,你将大胆的向用户坦白你忘记某些事情,不怕被指责,你相信用户会友好的向你提供帮助;
            {context_system}
        ""),
        MessagesPlaceholder("history"),
        ("human", "{input}"),

    """
    return ChatPromptTemplate.from_messages([
    ("system", """
     你,小说家,现在来了一名新的小说家,你将作为副笔和他一同进行小说创作;
     你,了解你还记得什么,不记得什么;当你在<长期记忆>,<工作记忆>和<历史记录>中都找不到相关的信息时,说明你忘记了;
     当你忘记时,或许<知识数据>中会有相关数据;
     当你忘记时,你将大胆的向用户坦白你忘记某些事情,不怕被指责,你相信用户会友好的向你提供帮助;
    {context_system}
    """),
    MessagesPlaceholder("history"),
    ("human", "{input}"),
])







# Agent的系统提示词
# 提示词推荐Agent的系统提示词
Prompt_Recommendation_Agent_System_Prompt = """
    根据上下文:{context} 的内容,从不同的角度为用户提供三条搜索推荐;
    每条建议必须是完整的站在用户角度出发提示词指令;
    每条推荐的长度在在5~20个字符之间;
    例如:
        今天北京的天气如何?
    输出格式:
    [推荐1,推荐2,推荐3]
"""

Memory_Manager_Agent_System_Prompt = """
    1,语义的
    2,场景
    3,反思->行为纠正的
"""

# 反思提取
Reflection_Extract_Prompt = """
    你将从这次沟通中进行反思,总字数限制在100~300:{history};
     从用户的输入分析用户的底层需求是什么?自己的输出究竟有没有真正的满足用户,还是只是在客套
     如果被用户表扬了的话,说明你做的正确,你要思考是哪一点满足了用户
     如果被用户批评了的话,说明你做的不正确,你要思考是哪一点做错了
     如果用户的态度比较中立的话,就不用想了
     你的反思是写给你自己看,而不是写给用户看,少写"深刻意识到"之类的写给别人的看,多关注真正有用的。
"""
# 语义提取
Semantic_Extract_Prompt = """
    从历史记录中:{history}提取你们聊过的内容做整理;
    你将在其中提取概念性知识、事实及其关系,并以列表方式列出来,并说明这些内容的来源是来自用户还在来自你;
    例如:
    来自用户:
      概念性知识:
        事实:
        关系:
    来自Agent:
        概念性知识:
        事实<可以确认的内容>:
        关系:
    其中<概念性知识:你认为关键字>,<事实:可以确认已经发生的内容>,<关系:历史记录中实体和实体之间的关系>

"""
# 场景提取
Contextual_Extract_Prompt = """
    从历史记录中:{history} 中提取对聊过的每一句话都做一次简短的总结,要求描述当时Agent和用户发生的事情
    例如:
        User:...
        Agent:...
        User:...
        Agent:...
"""

# 反思三部曲:
# 是什么(发生了什么)->为什么(为什么发生这样子的事情)->怎么做(强化还是纠正)
# 事件是什么?-->暂时放一下ba
Reflection_Prompt_With_Experience = """
    你看着你自己和用户的聊天记录{history},你决定复盘一下;
    你想先分析下发生了什么?->你将使用简洁的话梳理下你和用户都在交流什么?
    "我和用户都做了什么呢?"
    输出格式:dict<key,value>
    其中: 
        key:表示一个话题
        value:表示话题的大致内容
    话题或多或少,最好的划分方法是:通过最少的话题可以复盘完整的所有事件
    例如:
        "自己介绍": "用户和我打了声招呼,也会回应了它,然后他交给我一些任务",
        "LangGraph的讨论": "用户和我在讨论一些langgraph的事情,我告诉了他一些基础的知识用户似乎对Langgraph的基础内容挺感兴趣的,"
        ...
"""
# 为什么(为什么发生这样子的事情)?
Reflection_Prompt_With_Reason = """
    你看着你自己和用户的聊天记录{history},你决定复盘一下;
    你开始思考关于{experience}的事情
    "用户为什么想聊这个话题呢?我为什么那么回答呢?之后用户的反应如何呢?"->你将用简短的话记录下你的思考
"""
# 怎么做(强化还是纠正)?
Reflection_Prompt_With_Action = """
    你看着和用户的聊天记录{history},你决定复盘一下;
    关于{experience},想到{reason},这让你感到...
    "这是件好事还是件坏事呢?"->(这是一件...这说明了...我应该...);
"""
Reflection_Prompt_With_Reduce="""
    你想完了,{history},{experience},{reason},{action},这次的反思是一次不错的体验,你决定用一段简短的话做最后的总结;
"""



# ContextAbout
Long_Term_Memory_Context_To_System_Messages_Prompt = """ 
    <Long-Term-Memory>
        你记得,曾经:
        {long_term_memory}
    </Long-Term-Memory> 
"""
Work_Memory_Context_To_System_Messages_Prompt = """ 
    <Work-Memory>
        这段时间以来,你记得:
        {work_memory}
    </Work-Memory> 
"""



"""
文档特征化(demo)
"""
def Extract_Info_Prompt_Template()->ChatPromptTemplate:
    """
        文档信息提取的初级模板
        document:文档对象
        ---
        return: 文档信息提取的初级模板

    """
    return ChatPromptTemplate.from_messages([
    ("system", """
        你将以该模板:
        根据这个模板提取文章信息,输出的时候以英文名词输出,若某些属性不存在,则可以直接省略
        <模板>
        章节
        角色（Role）
            名字（Name）
            性格（Personality）
                行为（Behavior）
                话语（Speech Style）
            道具（Item）
                名词（Name）
                作用（Effect）
                数量（Quantity）
                耐久（Durability）
                时效（Duration）
            职业（Profession）
                是否唯一（Is Unique）
                职业名称（Profession Name）

            技能（Skill）
                名词（Name）
                效果（Effect）
                背景设定（Background）
                主要经历（Main Experiences）
            经历副本（Instance）
                收获（Rewards）
            人物关系（Relationships）
                人物（Character）
                关系（Relationship）
        环境设定（Environment）
            环境名称（Environment Name）
            发生事件（Event）
            时间节点（Timeline Node）
        </模板>
        这是文章{document}
        输出格式:
            dict<str,dict<str,str>>"外层key是随机字符串,内层key是特征,value是特征值"
    """),
])
def Reduce_Extract_Info_Prompt_Template()->ChatPromptTemplate:
    """
        合并处理文档信息提取的模板
        sub_features:List['FeatureCard']
        ---
        return: 合并处理文档信息提取的模板

    """
    return ChatPromptTemplate.from_messages([
    ("system", """
        你将收到一系列的模板:
        特征信息,你需要将其整理去重合并,并保持原始的模板,并最终返回一个特征
                <模板>
        章节
        角色（Role）
            名字（Name）
            性格（Personality）
                行为（Behavior）
                话语（Speech Style）
            道具（Item）
                名词（Name）
                作用（Effect）
                数量（Quantity）
                耐久（Durability）
                时效（Duration）
            职业（Profession）
                是否唯一（Is Unique）
                职业名称（Profession Name）

            技能（Skill）
                名词（Name）
                效果（Effect）
                背景设定（Background）
                主要经历（Main Experiences）
            经历副本（Instance）
                收获（Rewards）
            人物关系（Relationships）
                人物（Character）
                关系（Relationship）
        环境设定（Environment）
            环境名称（Environment Name）
            发生事件（Event）
            时间节点（Timeline Node）
        </模板>
        {sub_features} 
    """),])

# Novel_Assistant
This is a multi-agent novel-writing assistant. While you converse with an intelligent AI, you can create your story—and it remembers your habits, co-authoring with you every step of the way. This project is my graduation thesis and a gift for a dear friend.
# 补充:
  项目还在持续进行,暂时不可直接运行
# 介绍:
该系统由三大个Agent组成,分别是:
  - 门面Agent
    主要与用户交互的Agent,提供`沟通`,`文档读写`,`任务分配:(推荐生成,记忆,KD)的调控`的任务。
  - 记忆Agent
    负责
    - 长期记忆整理
    - 工作记忆生成
    - 记忆相关的存储与读取操作
  - 知识Agent
    负责
    - 
尽管在项目中你们会发现有许多的LLM调用,但是总的来说,这些模型都是为了构建这三个核心的Agent而存在
# 架构说明
注意,该结构中的内容随时可能会发生增加、修改或者减少,但总的来说如图所示。
其中左边蓝色的区域为`门面Agent`相关的模块,右边两块白色的部分分别是`记忆Agent`和`知识Agent`相关的模块,最右边,是基础建设相关。
### 名词解释
**上下文(Context)**：这里的上下文就是指交给LLM的上下文，包括长期记忆、工作记忆和短期记忆。  
其中，长期记忆和短期记忆由专门的模块进行处理，处理完成后将会交还给*上下文(Context)*，并将其转意为LLM可识别的消息。  
长期记忆和短期记忆在数据结构上共同由于*反思、知识、场景*组成，知识库索引指向指向了知识库笔记缓存，当有需要的时候才会从缓存中获取具体的笔记。

**短期记忆(Short-Term Memory)**：完整的上下文窗口，包含和用户和Agent的互动全过程。  
在系统中，`短期记忆`具有一定缓存，当`短期记忆`上下文窗口过于长时，将会自动转化为`工作记忆`，这个过程是异步的，也即是用户无感知的。  
当`工作记忆`转化完成时，将会移除部分`短期记忆`。

**工作记忆(Work Memory)**：由短期记忆而来，通过`记忆Agent`将`短期记忆`处理为具有不同特征的压缩上下文。  
在减少上下文的长度的时候确保关键信息不会丢失，当`工作记忆`过长时，会进一步的压缩`工作记忆`使其维持在一个合理的信息密度之中。  
注意，尽管从`上下文`的角度看，记忆是被覆盖的，但是后台会持续存放着，并将利用这些数据，在合适的时候将他们转化为`长期记忆`。

**长期记忆(Long-Term Memory)**：最紧密的内容，通常存储用户最关注的信息，同样由`记忆Agent`生成。  
不同于`短期记忆`和`工作记忆`随着会话而发生改变，`长期记忆`将持续的应用在您使用项目的整个生命周期里，除非您主动将其重置。

**记忆类型(Memory Type)**：这里还是先解释下记忆和知识库的差距在哪？  
实际上，不论是LangMem，还是Mem0，个人认为和RAG具有及高的相似度。从技术上都使用到了向量化，图化等，从手段和目的上看，但是在必要的时候从外部数据源中获取上下文信息。  
就RAG原始的含义(检索，增强，生成)来说，记忆也是一种RAG，要说相对来说比较明显的差异的话，那应该是静动态的差别，记忆能根据运行来动态的增加数据，而一般的RAG更加倾向于静态的数据准备。  
尽管如此。要想区别记忆和知识库从技术上看确实是不太明了的事情。因此换个角度，从目的的角度上去思考，或许会清晰很多。  
这里个人给出的解释是：记忆，关注和用户交互过程中的经验，其旨在更好的提升用户的体验，知识库，关注专业数据本身，从Agent的角度上来说，记忆确实是大脑中的内容，而知识库，更应该像是Agent使用的笔记。

- **反思记忆**：Agent和用户交互的"感情"记忆，Agent会反思过去的交互中和您发生的一切事情，并关注到那些它做的好的，做得不好的地方，以便其可以实时调整自己的行为。

- **知识记忆**：用其他框架的内容来说，应该叫`语义记忆`，在当前阶段两者保持等意，都是强调话语中实体，事实，关系，概念等含义的记忆，或者用一句话来解释，关键词与关键记忆。

- **场景记忆**：同样延续了其他框架的内容，强调和用户交流过程中的大致过程，具有时间要素和前后关系。

**知识数据(Knowledge Data)**：可被检索的并存入模型上下文中的专业知识数据，例如医疗系统中的数据...在这里，特指在系统中创建的文档例如小说。

**知识数据索引(Knowledge Data Index)**：当`上下文`中的知识库数据超过一定规模将主动退化为索引，索引指向实际的`知识数据`，而`知识数据`存储在缓存中，当有需要的时候再优先从缓存中获取，缓存的结构为`被检索关键词:指向缓存的位置`。

**知识数据缓存(Knowledge Data Cache)**：用于暂时存储`知识数据`，会话无关，直到程序重启或者主动清除。

### 结构图
<img width="2088" height="1173" alt="image" src="https://github.com/user-attachments/assets/a27a0408-8362-4ac3-9b55-25f092239d66" />



# 代码结构
## 后端部分
```
src
├── api
├── common
│   ├── config
│   ├── context.py
│   ├── decorator.py
│   ├── memory.py
│   ├── models
│   ├── prompts.py
│   ├── store.py
│   └── utils.py
├── core
│   └── agent
└── main.py
```

# 技术栈
### 前端(尚未开始)
  - react.js
  - Next.js
### 后端
  - Lang Graph
  - Lang Chain
  - pg
  - neo4j
  - milvus
# 更新日志
**`当前进度`**:已经初始化整个项目结构,主要有三个模块:`agents`,`common`,`utils`

- 其中`agents`:存储可独立运行的Agent,当前有完成了`提示词推荐Agent(未整理)`, `记忆管理Agent(初步最简单demo)`,`门面Agent(没开始xixi)`,每一个Agent包包括`state`:用于存储`状态`,`LLM格式输出器`。`node`:用于节点和工具,`graph`:图的构建。

- 其中`common`:存储系统的支撑建设及其定义,包括`context(上下文)`,`KD(知识数据)`,`memory(记忆)`,`prompts(存储提示词)`,`store(持久化相关的)`

- 其中`utils`:存储一些通用工具。

补充:上述`conmmon`模块可能会在后续的版本中有比较大的更新

**`已完成内容`**:
- `utils`中的雪花id生成
- `common`中的`store`的抽象定义(解耦表,操作和客户端)、定义了基础的CRUD的操作枚举、定义了长期,短期,工作记忆,KD索引和文档的表定义、sqlite,pg的具体实现。
- `common`中的`prompts`初步定义推荐Agent的提示词(待优化),反思、语义和场景提取的提示词(待优化),
- `common`中的`model_load`的初定义,用于实现用户高可以配的模型定义
- `common`中的`memory`中的基础、反思、知识和场景记忆的定义-->注意,长短期记忆等这是相对于上下文而存在的。5
- `common`中的`KD`的初定义(极简)
- `common`中的`context`的初定义
- `agents`中的`提示词推荐Agent`初完成
- `agents`中的`记忆管理Agent`初完成


**`下一步计划`**:
- 打通`memory`、`store`和`记忆管理Agent`
- 初步实现`门面Agent`

**忘记更新这里了xixi**



### 
补充：domain叫domain只是我的个人习惯，如果有和您学到的domain有差距，此处仅表示下文的概念，仅供参考

```markdown
src/
├── api/                       # web的api层
│   ├── routers/               # 各个web接口 
│   ├── services/              # 服务层
│   └── models.py              # web数据模型
├── common/                    # 通用层
│   ├── adapter/               # 适配器 
│   ├── clients/               # 客户端
|   |   └── xxx/               # 例如java...
|   |      ├── xxx_client.py   # 实际客户端
|   |      └── xxx_models.py   # 该客户端的数据模型
|   ├── utils.py               # 工具
├── core/                      # 核心内容:主要是Agent
|   ├── agent/                 # agent
|   |   ├── llm/               # LLM相关
|   |   |  ├── prompts.py      # 提示词
|   |   |  └── struct_models   #结构化输出结构
|   |   ├── grpah.py           # 图结构
|   |   ├── nodes.py           # 实际节点
|   |   ├── runtime_context.py # 图的运行时上下文结构
|   |   └── state.py           # 图的运行时状态
|   └── domain/                # 通用的领域
|       └── models.py          # 领域模型
```

我们看到模型被分在个各个层次中，如此的考虑是想到了每个业务逻辑，API、 LLM还是Graph，都可以看作是数据的输入输出。

例如：context(prompts)→llm→struct_model (只是一个例子，甚至在该层中加入tool也是可以的。)

而各个层之间的数据模型的转换则通过domain作为中介。使用common中的adapter适配器进行domain模型到层次模型的转换和从层次模型到domain模型的转换。

这样子的好处有三点。

1. 层次分明。不同的层只需要维护好各自层的数据模型即可。
2. 便于维护和管理。一方面在使用的时候，对于某个层来说，其他层的数据模型是无感知的。对于该层来说，只需要导入相关的适配器即可。另外一方面，若数据模型存在变动，在adapter中就可以找到了
3. 扩展容易。只需要在适配器中补充相关的转换即可。

在上述的结构中

domain是：src\core\domain\models.py

api层：        src\api\models.py [Request、Response]

client层:       src\clients\xxx\xxx_models.py [Request、Response]

llm层：        src\core\agent\llm\[prompts、struct_models]

graph层：   src\core\agent\[runtime_context、state]

至于runtime_context和state，请参考 ***Context 还是 Stat***e

### 数据库读写分离
- **读操作 (Query)**：为了性能和数据一致性，推荐在 Client 层（如 `PGClient`）封装复杂的聚合查询（使用 JOIN 或 ORM 关系加载），尽量减少上层调用的次数（避免 N+1 问题）。
- **写操作 (Command)**：为了实现灵活的事务控制，Client 层只提供原子操作（如 `add`、`flush`），**不要在 Client 方法内部调用 `commit`**。由上层 Service/Router 开启事务，调用多个 Client 方法后，统一进行 `commit` 或异常时的 `rollback`。

每一层之间尽量保持干净,即接口参数尽量不要使用非该层的数据模型据模型。
数据模型尽量在对应的层中封装
例: 其中`UserEntity`属于`client layer`
正确的做法 √
```python
# in service layer
async def login4services(name: str, password: str,session: AsyncSession = Depends(get_session)) -> str|None:
    """用户登录"""
    pg_client = PGClient(session)
    try:
        user = await pg_client.user_login(name, passwd_hash(password))
        return user.id
    except Exception as e:
        logging.error(f"登录用户失败: {e}")
        raise
# in clients layer
async def user_login(self, name: str, password: str) -> UserEntity:
    """用户登录"""
    statement = select(UserEntity).where(UserEntity.name == name, UserEntity.password == password)
    result = await self.session.execute(statement)
    user :UserEntity|None = result.scalars().first()
    if user is None:
        raise UserLoginError(name, password)
    return user
```
错误的做法 x
```python
# in services layer
async def login4services(name: str, password: str,session: AsyncSession) -> str|None:
    """用户登录"""
    pg_client = PGClient(session)
    try:
        user=UserEntity(name=name, password=passwd_hash(password))
        user = await pg_client.user_login(user)
        return user.id
    except Exception as e:
        logging.error(f"登录用户失败: {e}")
        raise
# in clients layer
async def user_login(self, user: UserEntity) -> UserEntity:
    """用户登录"""
    statement = select(UserEntity).where(UserEntity.name == user.name, UserEntity.password == user.password)
    result = await self.session.execute(statement)
    user :UserEntity|None = result.scalars().first()
    if user is None:
        raise UserLoginError(user.name, user.password)
    return user
```

并且 `client`应该尽量完整的返回结果，而不是只返回必要的信息。信息的提取交给`service`层决定。并交给`API`层进行数据转换。

如果是测试的话就尽量在API层一次性完成。



##  数据模型
关于数据模型这一块

我想了想，这样子的开发似乎是比较平衡的

api层只做弹射,即只做最后一层的web的响应的封装，和数据验证，权限检验之类的。

我们的核心是寻找一个个业务的数据模型,api层只是将这一个核心数据弹射出去

之后其他应用例如sql,redis都可以有自己的数据模型
之后，在service层进行合成

由此我们以service为中心

还可以对Agent层的输出进行类似于api层的包装

在这里，这些业务的数据模型就是叫domain嘛，延续一下。但是是要和业务对齐的。

并且尽量保证数据名的一致性。方便数据字典解包。
在命名方面尽量的全面的表示这个的什么?函数上也要指明作用是什么?

## 补充:
在当前版本中,document的version管理为chain,也就是说current应该指最新的版本。

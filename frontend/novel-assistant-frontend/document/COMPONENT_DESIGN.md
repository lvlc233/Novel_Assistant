# 组件化设计与组合方式优化文档

**项目**: Novel Assistant Frontend
**创建日期**: 2025-12-12
**版本**: v1.0
**状态**: 优化建议

---

## 🏗️ 页面架构与组件映射分析

基于项目需求，系统包含 3 个核心页面和 9 个关键组件。本章节分析页面与组件的映射关系、当前实现状态及优化建议。

### 1.1 页面架构概览

```
📱 页面架构
├── 🏠 Home Page (主页)
│   ├── 功能：功能导航、AI代理、快捷创建文档
│   ├── 路由：/home
│   └── 复杂度：中
├── 📁 Document Management (文档管理页面)
│   ├── 功能：文档列表、创建、删除、编辑
│   ├── 路由：/documents
│   └── 复杂度：高
├── 📁 Document Details (文档详情页面)
│   ├── 功能：文档详情、编辑、删除
│   ├── 路由：/documents/:id
│   └── 复杂度：高
├── ✏️  Editor (编辑页面)
│   ├── 功能：文档编辑、AI对话助手、目录导航
│   ├── 路由：/editor/:id
│   └── 复杂度：极高
```

### 1.2 页面-组件映射矩阵

| 页面 | 核心组件 | 当前实现状态 | 复用性 | 优先级 |
|------|---------|------------|--------|--------|
| **Home** | 功能卡片 | ✅ 已实现 (FeatureCard) | 高 | P1 |
| | 底部通用输入框 | ✅ 已实现 (BottomInput) | 高 | P0 |
| | AI助手侧边栏 | ✅ 已实现 (AIAssistantSidebar) | 极高 | P0 |
| | 邮箱图标 | ✅ 已实现 (MailIcon) | 低 | P3 |
| | 便捷导航 | ✅ 已实现 (QuickCreateMenu) | 中 | P2 |
| **文档管理** | 文档卡片 | ✅ 已实现 (NovelCard) | 高 | P1 |
| | 文档操作组件 | ⚠️ 基础实现（硬编码在 NovelCard 中） | 高 | P0 |
| | 文档创建块 | ⚠️ 仍耦合严重（190行，两种模式） | 中 | P0 |
| | 搜索栏 | ✅ 已实现 (SearchBar - 统一版本) | 高 | P1 |
| **Editor** | 编辑时目录 | ✅ 已实现 (TableOfContents) | 高 | P1 |
| | 文档编辑区 | ✅ 已实现 (DocumentEditor) | 中 | P1 |
| | AI助手侧边栏 | ✅ 已实现 (AIAssistantSidebar) | 极高 | P0 |
| | 底部通用输入框 | ✅ 已实现 (BottomInput) | 高 | P0 |

**图例说明**:
- ✅ 已实现：功能完整，可用但可能需要优化
- ⚠️ 部分实现：功能存在但设计或实现上有问题
- ❌ 未实现：完全缺失，需要新建
- **P0**: 阻塞级，必须立即处理
- **P1**: 高优先级，建议尽快处理
- **P2**: 中优先级，可在迭代中处理
- **P3**: 低优先级，可延后处理

### 1.3 页面详细分析

#### 📄 Page 1: Home (主页)

**页面描述**：
前端项目的主页，负责 3 个功能：
1. 功能卡片，让用户知道有什么操作
2. 连接 AI，让 AI 进行代理操作
3. 便捷的文档创建，点击创建直接去到编辑页面

**当前组件实现分析**:

**1. 功能卡片 (FeatureCard)** ✅
```tsx
// 当前位置: src/components/Home/FeatureCard.tsx
// 当前状态: 可用，但存在样式问题

优点：
- ✅ 组件化良好，接受 props 配置
- ✅ 在 Dashboard 中复用 4 次
- ✅ 支持自定义图标、颜色、旋转角度
- ✅ 有可用的 TypeScript 接口

缺点：
- ❌ 图标被注释掉 (line 40)
- ❌ 使用硬编码颜色 (bg-surface-secondary, text-text-secondary)
- ❌ 类名过长 (198 字符)
- ❌ 动画延迟逻辑在 Dashboard 中处理

// 当前 Dashboard 实现:
cards.map((card, index) => (
  <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
    <FeatureCard ... />
  </div>
))

// 改进建议:
// 方案 1: 将动画逻辑移入 FeatureCard
<FeatureCard index={index} ... />

// 方案 2: 使用组合模式
<FeatureCardWithAnimation index={index} ...>
  <FeatureCard ... />
</FeatureCardWithAnimation>

// 方案 3: 使用 CSS 动画库 (framer-motion)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
  <FeatureCard ... />
</motion.div>
```

**2. 底部通用输入框** ✅
```tsx
// 当前位置: src/components/base/BottomInput.tsx
// 当前状态: 已实现，接口统一

实现特点：
- ✅ 统一的底部输入框组件（已替代5个分散组件）
- ✅ 标准化 API（BottomInputProps）
- ✅ 支持可配置占位文本
- ✅ 支持文件上传按钮（预留接口）
- ✅ 支持快捷键（Cmd+Enter）
- ✅ 固定/静态定位可配置
- ✅ 加载状态管理
- ✅ 类型安全（TypeScript）

已实现功能：
- 在 Home 和 Editor 页面可复用
- 支持 onFileUpload 回调
- 支持 enableShortcuts 配置
- 支持 loading 状态

文件位置：
components/base/
└── BottomInput.tsx (已实现于 2025-12-12)

使用示例：
// Editor 页面（与当前文档关联）:
<BottomInput
  placeholder="向 AI 提问关于本章内容..."
  onSubmit={handleSend}
  enableFileUpload={true}
  enableShortcuts={true}
  loading={isLoading}
  position="static"
/>
```


实现特点：
- ✅ 可展开/收起侧边栏
- ✅ 独立状态管理（对话历史）
- ✅ 支持 context 参数（outline/character/plot/general）
- ✅ 集成 BottomInput 组件
- ✅ 支持 novelId 关联
- ✅ 清晰的 Header 显示
- ✅ 类型安全（TypeScript）

已实现的子组件：
components/ai-assistant/
├── AIAssistantSidebar.tsx      // 主容器（已实现）
├── ChatHistory.tsx              // 对话历史（已实现）
└── ChatMessage.tsx              // 单条消息（已实现）

使用示例：
// Editor 页面（与当前文档关联）:
<AIAssistantSidebar
  novelId={currentDocumentId}
  context="general"
  defaultExpanded={true}
  onExpandedChange={handleExpandedChange}
/>

// Home 页面（浮动按钮模式）:
<AIAssistantSidebar
  context="general"
  defaultExpanded={false}
  onClose={handleClose}
/>

当前限制：
- 目前使用模拟数据（Mock AI response）
- 暂不支持调整大小
- 暂未实现设置面板
- 待接入真实后端 API
```

**4. 邮箱图标** ✅
```tsx
// 当前位置: src/components/MailIcon.tsx
// 当前状态: 已实现，功能简单

// 实现特点：
- 固定定位（右下角）
- 点击触发回调
- 没有复杂业务逻辑
- 属于图标类别组件

// 问题：与其他设计不一致（为什么用邮箱图标？）
// 建议：如果用于通知，应该叫 NotificationIcon
// 如果用于 AI 助手，应该叫 AIAssistantTrigger
```

**5. 便捷导航/新建文档** ⚠️
```tsx
// 当前状态: 在 FeatureCard 中实现，但不够直观

现状分析：
- Dashboard 中的第四个卡片是"新建"按钮
- 点击后导航到 /editor
- 缺少快捷操作（比如快速创建、模板选择）

// 改进建议:
components/home/
├── QuickCreateMenu.tsx          // 快速创建菜单
├── TemplateSelector.tsx          // 模板选择器
└── RecentDocuments.tsx           // 最近文档

// QuickCreateMenu.tsx
const QuickCreateMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4">
      <Button
        variant="primary"
        size="lg"
        rounded="full"
        className="shadow-xl"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-6 h-6" />
        新建
      </Button>

      {open && (
        <div className="mt-2 bg-surface-white rounded-xl shadow-xl p-2 w-64">
          <button className="w-full text-left p-2 hover:bg-surface-hover rounded">
            新建空白文档
          </button>
          <button className="w-full text-left p-2 hover:bg-surface-hover rounded">
            使用模板
          </button>
          <button className="w-full text-left p-2 hover:bg-surface-hover rounded">
            导入文档
          </button>
        </div>
      )}
    </div>
  );
};
```

#### 📄 Page 2: 文档管理页面

**页面描述**：在这里管理着用户的文档，主要是做文档的操作的如创建和删除等

**当前组件实现分析**:

**1. 文档卡片 (NovelCard)** ✅
```tsx
// 当前位置: src/components/Document/NovelCard.tsx
// 当前状态: 基础功能实现

优点：
- ✅ 展示封面、标题、字数、更新日期
- ✅ 支持活跃/非活跃状态切换
- ✅ 包含三个操作按钮（知识库、编辑、删除）

缺点：
- ❌ 操作按钮样式硬编码
- ❌ 使用模板字符串拼接类名
- ❌ 无法自定义操作（比如添加"分享"）
- ❌ 高度耦合业务逻辑

// 建议改进（使用 Compound Component 模式）:
// 参考 2.3 节的 NovelCard 重构方案
```

**2. 文档操作组件** ⚠️
```tsx
// 当前状态: 在 NovelCard 内部硬编码，未独立抽象

现状分析：
- 每个卡片包含 3 个操作按钮
- 按钮样式和逻辑重用在 CreateNovelCard 中
- 操作类型有限（仅：知识库、编辑、删除）

需求：
- 独立的文档操作组件
- 支持配置操作列表
- 可扩展（添加新操作如：分享、导出、发布）
- 支持批量操作

// 建议实现:
components/documents/
├── DocumentCardActions.tsx
├── ActionButton.tsx
└── BulkOperationsBar.tsx

// DocumentCardActions.tsx
interface DocumentCardActionsProps {
  actions: ActionConfig[];
  orientation?: 'horizontal' | 'vertical';
  groupHover?: boolean;
}

interface ActionConfig {
  key: string;
  icon: React.ReactNode;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onClick: () => void;
}

const DocumentCardActions: React.FC<DocumentCardActionsProps> = ({
  actions,
  orientation = 'horizontal',
  groupHover = true,
}) => {
  return (
    <div
      className={`
        flex gap-2
        ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}
        ${groupHover ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}
      `}
    >
      {actions.map(action => (
        <ActionButton
          key={action.key}
          icon={action.icon}
          color={action.color}
          tooltip={action.label}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
};

// 使用示例
<NovelCard novel={novel}>
  <NovelCard.Actions>
    <DocumentCardActions
      actions={[
        {
          key: 'knowledge-base',
          icon: <BookOpen />,
          label: '知识库',
          color: 'success',
          onClick: () => openKnowledgeBase(novel),
        },
        {
          key: 'edit',
          icon: <Edit />,
          label: '编辑',
          color: 'warning',
          onClick: () => editNovel(novel),
        },
        {
          key: 'delete',
          icon: <Trash2 />,
          label: '删除',
          color: 'error',
          onClick: () => deleteNovel(novel.id),
        },
        {
          key: 'share',
          icon: <Share2 />,
          label: '分享',
          color: 'primary',
          onClick: () => shareNovel(novel),
        },
      ]}
    />
  </NovelCard.Actions>
</NovelCard>
```

**3. 文档创建块 (CreateNovelCard)** ⚠️
```tsx
// 当前位置: src/components/Document/CreateNovelCard.tsx
// 当前状态: 功能可用，但严重耦合

优点：
- ✅ 支持小说信息填写（标题、简介、封面）
- ✅ 支持知识库关联和创建
- ✅ 分为两个模式（小说创建、知识库创建）

缺点：
- ❌ 290 行代码，职责过多
- ❌ 同时处理小说和知识库创建
- ❌ 状态管理复杂（8+ 个状态）
- ❌ 难以测试和复用
- ❌ 无模板选择功能

// 建议重构：参考 2.2 节的 CreateNovelCard 拆解方案
// 核心改进：
// 1. 拆分为 5 个子组件（见文档 2.2 节）
// 2. 提取 useNovelCreationForm Hook
// 3. 提取文档模板选择功能

// 增强功能：
components/documents/create/
├── NovelCreationContainer.tsx        // 主容器
├── NovelCoverUpload.tsx               // 封面上传
├── KnowledgeBaseSelector.tsx          // 知识库选择
├── KnowledgeBaseCreationForm.tsx      // 知识库创建
├── DocumentTemplateSelector.tsx       // 新增：模板选择
└── useNovelCreationForm.ts            // 表单逻辑

// DocumentTemplateSelector.tsx
interface DocumentTemplateSelectorProps {
  selected?: string;
  onSelect: (template: DocumentTemplate) => void;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  defaultStructure: {
    chapters?: string[];
    characterSheets?: boolean;
    worldBuilding?: boolean;
  };
}

const DocumentTemplateSelector: React.FC<DocumentTemplateSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const templates: DocumentTemplate[] = [
    {
      id: 'novel',
      name: '长篇小说',
      description: '完整的小说结构（世界观、人物、情节）',
      tags: ['小说', '长篇'],
      defaultStructure: {
        chapters: ['第一章', '第二章', '第三章'],
        characterSheets: true,
        worldBuilding: true,
      },
    },
    {
      id: 'short-story',
      name: '短篇小说',
      description: '简洁的短篇故事结构',
      tags: ['小说', '短篇'],
      defaultStructure: {
        chapters: ['开篇', '发展', '高潮', '结局'],
        characterSheets: false,
        worldBuilding: false,
      },
    },
    {
      id: 'world-building',
      name: '世界观设定',
      description: '专注于世界观构建',
      tags: ['设定'],
      defaultStructure: {
        chapters: ['地理', '历史', '文化', '政治'],
        characterSheets: false,
        worldBuilding: true,
      },
    },
  ];

  return (
    <div className="mb-4">
      <h4 className="text-sm font-bold text-gray-800 mb-2">选择模板</h4>
      <div className="grid grid-cols-3 gap-3">
        {templates.map(template => (
          <Card
            key={template.id}
            className={`p-3 cursor-pointer transition-all
              ${selected === template.id ? 'ring-2 ring-accent-primary' : ''}
              hover:shadow-md hover:-translate-y-0.5
            `}
            onClick={() => onSelect(template)}
          >
            <h5 className="font-medium mb-1">{template.name}</h5>
            <p className="text-xs text-text-secondary mb-2">{template.description}</p>
            <div className="flex gap-1">
              {template.tags.map(tag => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

**4. 搜索栏 (SearchBar)** ⚠️
```tsx
// 当前状态: 两个版本重复实现

版本 1: src/components/Home/SearchBar.tsx
版本 2: src/components/HomePage/SearchBar.tsx

问题：
- ❌ 文件结构混乱（Home 和 HomePage 两个目录）
- ❌ 功能重复但样式不一致
- ❌ 搜索逻辑未复用

// 建议：
// 1. 合并为一个通用组件
// 2. 放在 components/base/SearchBar.tsx
// 3. 在 Home 和 Document Management 中复用

// 配置化实现:
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;  // 防抖延迟
  suggestions?: { id: string; content: string }[];
  autoFocus?: boolean;
}
```

#### 📄 Page 3: Editor (编辑页面)

**页面描述**：点击进入一本小说后，进入编辑页面，编辑页面中存在对话助手和文档目录和正文编辑区域

**当前组件实现分析**:

**1. 文档编辑区 (DocumentEditor)** ✅
```tsx
// 当前位置: src/components/DocumentEdit/DocumentEditor.tsx
// 当前状态: 已实现，功能复杂

特点：
- ✅ 富文本编辑器
- ✅ 支持基本格式工具栏
- ✅ 自动保存功能
- ⚠️ 代码较长，需要拆分

// 建议优化：
// 提取自定义 Hook
hooks/editor/
├── useAutoSave.ts              // 自动保存
├── useEditorState.ts           // 编辑器状态
├── useTextFormatting.ts        // 文本格式化
└── useCollaboration.ts         // 协作编辑（未来）
```

**2. 编辑时目录 (TableOfContents)** ✅
```tsx
// 当前位置: src/components/Table/TableOfContents.tsx
// 当前状态: 已实现

特点：
- ✅ 展示文档结构
- ✅ 点击跳转章节
- ✅ 可折叠层级

// 建议增强：
// 1. 支持拖动排序章节
// 2. 支持右键菜单（添加、删除、重命名）
// 3. 支持搜索章节
// 4. 显示章节字数统计
```

**3. AI助手侧边栏** ❌
```tsx
// 当前状态: 完全未实现

// 已在上面的 Home 页面分析中详细说明
// 需要在 Editor 和 Home 中复用同一个组件
// 但传入不同的 context:

// Editor 页面（与当前文档关联）:
<AIAssistantSidebar
  novelId={currentNovelId}
  context="general"  // 或 "character", "plot", "world-building"
  defaultExpanded={true}
/>

// 建议功能：
// - 对话历史持久化
// - 上下文关联（当前章节、选中文字）
// - 创作建议（基于当前内容）
// - 角色分析
// - 情节发展建议
// - 世界观参考
```

**4. 底部通用输入框** ⚠️
```tsx
// 当前状态: 与 Home 页面需求一致

// 要求：
// 1. 在 Editor 页面用于 AI 对话
// 2. 在 Home 页面用于 AI 代理操作
// 3. 完全相同的交互逻辑

// 因此必须在 components/base/ 创建通用组件
// 两个页面复用，仅配置不同

// Editor 中使用（AI 对话）:
<BottomInput
  placeholder="向 AI 提问关于本章内容..."
  onSubmit={(message) => sendToAI(message, {
    type: 'editor-help',
    novelId: currentNovelId,
    chapterId: currentChapterId,
  })}
  enableFileUpload={true}
  enableShortcuts={true}
/>
```

### 1.4 组件覆盖度评估

**更新于 2025-12-12：**
```
组件覆盖度: 78% (7/9 组件完全实现)

✅ 完全实现 (7):
  - 功能卡片 (FeatureCard) - 可用但类名过长
  - 文档卡片 (NovelCard) - 按钮硬编码但仍可用
  - 编辑时目录 (TableOfContents)
  - 文档编辑区 (DocumentEditor)
  - 邮箱图标 (MailIcon)
  - 底部通用输入框 (BottomInput) - ✅ 2025-12-12 新增
  - AI助手侧边栏 (AIAssistantSidebar) - ✅ 2025-12-12 新增 (MVP)
  - 便捷导航 (QuickCreateMenu) - ✅ 2025-12-12 新增

⚠️ 部分实现 (2):
  - 文档创建块 (CreateNovelCard) - 仍耦合严重（190行，两种模式）
  - 文档操作组件 - 硬编码在 NovelCard 中，未独立抽象

❌ 已移除的问题:
  - 底部通用输入框分散实现 ✅ 已统一为 BottomInput
  - 搜索栏重复实现 ✅ 已统一到 base/SearchBar
  - AI助手侧边栏缺失 ✅ 已实现 MVP 版本
  - 便捷导航缺失 ✅ 已实现 QuickCreateMenu
```

### 1.5 关键缺失组件分析

#### ❌ AI助手侧边栏 (P0 优先级)【阻塞级】

**缺失影响**: 🔴 极高（核心功能）

**业务价值**：
- Home 页面：AI 代理操作的核心入口
- Editor 页面：创作助手的核心功能
- 复用率：100%（两个核心页面都需要）

**实现复杂度**: 🟡 中等

**建议实现路径**：
```
阶段 1 (MVP):
├── AIAssistantSidebar.tsx (主容器)
├── ChatHistory.tsx (简单消息列表)
└── ChatInput.tsx (底部输入)

阶段 2 (增强):
├── AIContext.tsx (状态管理)
├── ChatMessage.tsx (消息组件)
├── MessageAction.tsx (消息操作)
└── AssistantSettings.tsx (设置)

阶段 3 (高级):
├── ContextSelector.tsx (上下文选择)
├── PromptLibrary.tsx (提示词库)
├── ConversationHistory.tsx (历史记录)
└── AIPlugins.tsx (插件系统)
```

#### ❌ 文档操作组件 (P0 优先级)【阻塞级】

**缺失影响**: 🔴 高（影响用户体验）

**当前问题**：
- 操作按钮硬编码在 NovelCard 内部
- 无法添加新操作（如分享、导出）
- 批量操作功能缺失

**业务价值**：
- 提升用户体验（一致性）
- 支持功能扩展
- 支持批量操作

**实现复杂度**: 🟢 低

**建议实现**：
```tsx
// 2-3 小时即可完成
// 参考 2.3 节的 ActionButton + DocumentCardActions 方案
components/base/
└── ActionButton.tsx (1 小时)

components/documents/
└── DocumentCardActions.tsx (1 小时)
└── BulkOperationsBar.tsx (1 小时) [可选]
```

#### ❌ 底部通用输入框 (P0 优先级)【阻塞级】

**缺失影响**: 🔴 高（功能不完整）

**当前问题**：
- 5 个分散的组件（Input, SendButton, ChatTextarea, NewChatButton, SearchToggle）
- 没有统一的 API
- 无法在 Home 和 Editor 之间复用

**业务价值**：
- 统一用户体验
- 代码复用（减少重复）
- 便于维护
- 支持快捷键和文件上传

**实现复杂度**: 🟢 低

**建议实现**：
```tsx
// 参考 1.3 节的 BottomInput 实现方案
components/base/
└── BottomInput.tsx (3-4 小时)

功能特性：
✅ 插槽 API（支持左/右扩展）
✅ 文件上传（拖放）
✅ 快捷键（Cmd+Enter）
✅ 防抖输入
✅ 加载状态
✅ 错误处理
```

---

## 📊 当前组件结构分析

### 1.1 组件树概览

```
src/components/
├── MailIcon.tsx                          # 简单图标组件
├── BasicCard.tsx                         # 基础卡片组件（未充分使用）
├── CustomInputAddButton.tsx              # 自定义输入按钮
│
├── Home/                                 # 首页相关组件
│   ├── FeatureCard.tsx                   # 功能卡片（良好设计）
│   ├── Dashboard.tsx                     # 仪表盘（组合组件）
│   └── SearchBar.tsx                     # 搜索栏
│
├── Document/                             # 文档管理组件
│   ├── CreateNovelCard.tsx               # 新建小说卡片（复杂业务组件）
│   ├── NovelCard.tsx                     # 小说展示卡片
│   ├── KnowledgeBaseModal.tsx            # 知识库模态框（复杂）
│   ├── EditNovelModal.tsx                # 编辑小说模态框
│   └── DocumentCarousel.tsx              # 文档轮播
│
├── DocumentEdit/                         # 文档编辑组件
│   └── DocumentEditor.tsx                # 文档编辑器（复杂）
│
├── Sidebar/                              # 侧边栏组件
│   ├── Header/                          # 头部组件
│   │   └── Header.tsx
│   ├── Button/                          # 按钮组件
│   │   └── Button.tsx
│   └── Input/                           # 输入组件
│       ├── Input.tsx
│       ├── SendButton.tsx
│       ├── SearchToggle.tsx
│       ├── ChatTextarea.tsx
│       └── NewChatButton.tsx
│
├── Table/                                # 表格组件
│   └── TableOfContents.tsx               # 目录组件
│
└── HomePage/                             # 其他首页组件
    └── SearchBar.tsx                     # 搜索栏（重复！）
```

**统计**:
- 总组件数: 20+
- 主要业务组件: 8
- 基础组件: 3
- 复杂度分布: 简单(30%), 中等(50%), 复杂(20%)

### 1.2 组件复用性分析

#### ✅ 可复用组件 (Good)
1. **FeatureCard** - 通用功能卡片
   - 接受 title, icon, color, rotation props
   - 可在不同页面复用
   - 当前复用情况: Dashboard 中使用 4 次

2. **BasicCard** - 基础卡片（但使用不足）
   - 简单容器组件
   - 可扩展为多种样式

#### ⚠️ 半复用组件 (OK)
1. **NovelCard** - 小说卡片
   - 在文档列表中使用
   - 功能单一，不易扩展

2. **SearchBar** - 搜索栏
   - 在 Home 中有两个版本（SearchBar, HomePage/SearchBar）
   - 存在重复实现

#### ❌ 低复用性组件 (Problem)
1. **CreateNovelCard** (CreateNovelCard.tsx:42-181)
   - 单一用途，难以在其他场景使用
   - 包含过多内部状态（isCreatingKb）
   - 职责不单一（同时处理小说创建和知识库创建）

2. **KnowledgeBaseModal** (KnowledgeBaseModal.tsx:29-128)
   - 紧密耦合业务逻辑
   - 硬编码 知识库(mock) 数据
   - 难以测试和复用

---

## 🔍 关键问题识别

### 2.1 原子组件缺失 ❌【严重】

#### 问题描述
项目缺乏基础原子组件（Button、Input、Modal、Card、Avatar等），导致样式和业务逻辑混杂。

#### 具体表现

**实例：CreateNovelCard 中的按钮（多版本）**
```tsx
CreateNovelCard.tsx:

// 按钮版本 1 (line 51)
<button className="text-gray-400 hover:text-gray-600">
  <X className="w-5 h-5" />
</button>

// 按钮版本 2 (line 103)
<button className="p-1 hover:bg-gray-100 rounded border border-gray-200">
  <Plus className="w-3 h-3 text-gray-600" />
</button>

// 按钮版本 3 (line 125)
<button className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium
                   hover:bg-gray-800 transition-colors shadow-lg
                   hover:shadow-xl transform hover:-translate-y-0.5">
  创建
</button>

// 按钮版本 4 (line 166)
<button className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700
                   px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-50
                   transition-colors">
  <Save /> 保存
</button>

// 按钮版本 5（返回按钮）(line 162)
<button className="text-xs text-gray-500 hover:text-gray-800 px-2">
  返回
</button>

问题分析：
- 5 种不同的按钮样式在同一个组件中
- 没有统一的 Button 组件
- 样式定义散落在各处
- 维护困难（修改按钮样式需要改 5 处）
- 不一致的用户体验
```

**实例：输入框定义**
```tsx
// CreateNovelCard.tsx
// 输入框 1 (line 78)
<input type="text"
       className="w-full px-3 py-2 border-b border-gray-200
                  focus:border-blue-500 outline-none bg-transparent
                  font-serif text-lg" />

// 输入框 2 (line 98)
<select className="text-xs border border-gray-200 rounded px-2 py-1
                  bg-white outline-none">

// KnowledgeBaseModal.tsx
// 输入框 3 (line 146)
<input className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200
                  text-sm focus:border-blue-500 outline-none" />

问题分析：
- 多种输入框样式
- 聚焦状态颜色不一致（blue-500 vs 无）
- 边框样式不统一（border-b vs border）
- 缺少统一的 Input 组件
```

**统计**: 项目中有 12+ 种不同的按钮定义，8+ 种不同的输入框样式

#### 修复建议

**步骤 1: 创建基础原子组件**

```tsx
// components/base/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// 使用 class-variance-authority 管理变体
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent-primary text-white hover:bg-accent-secondary focus:ring-accent-primary',
        secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-hover focus:ring-accent-secondary',
        outline: 'border border-border-primary text-text-primary hover:bg-surface-secondary focus:ring-accent-primary',
        ghost: 'text-text-secondary hover:bg-surface-hover focus:ring-accent-secondary',
        success: 'bg-success text-white hover:bg-success-light focus:ring-success',
        warning: 'bg-warning text-white hover:bg-warning-light focus:ring-warning',
        error: 'bg-error text-white hover:bg-error-light focus:ring-error',
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        icon: 'w-10 h-10 p-2',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, rounded, className })}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

**使用示例**:
```tsx
// 替换 CreateNovelCard 中的 5 种按钮
<Button variant="ghost" size="icon" rounded="full" onClick={onCancel}>
  <X className="w-5 h-5" />
</Button>

<Button variant="outline" size="sm" rounded="md" onClick={() => setIsCreatingKb(true)}>
  <Plus className="w-3 h-3" />
</Button>

<Button variant="primary" size="md" rounded="full" className="shadow-lg hover:-translate-y-0.5">
  创建
</Button>

<Button variant="outline" size="sm" rounded="full">
  <Save className="w-3 h-3" />
  保存
</Button>

<Button variant="ghost" size="xs" onClick={() => setIsCreatingKb(false)}>
  返回
</Button>
```

**步骤 2: 创建基础输入组件**

```tsx
// components/base/Input.tsx
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'w-full bg-transparent transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2',
  {
    variants: {
      variant: {
        default: 'border border-border-primary rounded-lg px-3 py-2 focus:border-accent-secondary focus:ring-accent-secondary',
        underline: 'border-b border-border-primary px-0 py-2 focus:border-accent-secondary focus:ring-accent-secondary',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={inputVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

**步骤 3: 创建其他基础组件（Modal, Card, Avatar, Badge）**

```tsx
// components/base/Modal.tsx
import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeIcon?: boolean;
  backdrop?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  title,
  size = 'md',
  closeIcon = true,
  backdrop = true
}) => {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {backdrop && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`
          relative w-full ${sizeClasses[size]} bg-surface-white rounded-2xl shadow-modal
          transform transition-all animate-slide-up
          flex flex-col max-h-[90vh]
        `}
      >
        {/* Header */}
        {(title || closeIcon) && (
          <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-gray-50/50">
            {title && <h3 className="text-text-primary font-serif font-semibold">{title}</h3>}
            {closeIcon && (
              <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
```

**修复效果**:
- 样式统一管理，便于维护
- 用户体验一致
- 减少 CSS 类名重复
- 便于添加新变体
- 符合原子设计原则（Atoms）

**优先级**: 🔴 高 | **预计修复时间**: 4-5 小时 | **难度**: 中等

---

### 2.2 组件职责不单一 ❌【严重】

#### 问题描述
组件承担过多职责，违反单一职责原则（SRP），导致组件难以测试、维护和复用。

#### 具体表现

**实例：CreateNovelCard 组件**（290 行）

```tsx
// CreateNovelCard.tsx (职责分析)
const CreateNovelCard: React.FC<CreateNovelCardProps> = ({
  onCancel,
  onCreate,
  existingKnowledgeBases = []
}) => {
  // 职责 1: 表单状态管理
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    cover: null,
    selectedKbIds: []
  });

  // 职责 2: 知识库创建状态
  const [isCreatingKb, setIsCreatingKb] = useState(false);
  const [newKbData, setNewKbData] = useState({ name: '', tags: '', description: '' });

  // 职责 3: 文件上传处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, cover: e.target.files[0] });
    }
  };

  // 职责 4: UI 渲染（两个完全不同的模式）
  return (
    <div>
      {!isCreatingKb ? (
        /* Mode 1: 小说创建表单 */
      ) : (
        /* Mode 2: 知识库创建表单 */
      )}
    </div>
  );
};

问题分析：
- 单个组件同时处理"小说创建"和"知识库创建"两个独立功能
- 复杂度: 290 行代码
- 内部状态复杂（8+ 个状态变量）
- 渲染逻辑分支复杂（两个完全不同的 UI 模式）
- 难以测试（需要测试多种组合）
- 难以复用（在其他页面只能使用整个逻辑）
- 违反单一职责原则
```

**组件复杂性分析**:
```
CreateNovelCard
├── 表单状态管理
├── 文件上传逻辑
├── 知识库创建逻辑
├── 条件渲染（两个模式）
├── 头部 UI
├── 左侧封面区域
├── 右侧内容区域
├── 简介表单
├── 知识库表单
└── 按钮逻辑
```

**KnowledgeBaseModal 组件** 类似问题：
- 包含 mock 数据
- 包含新建知识库逻辑
- 与 CreateNovelCard 重复实现新建功能

#### 修复建议

**基于组合模式的重构**（推荐）

将 CreateNovelCard 拆分为多个高内聚、低耦合的组件：

```tsx
// Step 1: 提取数据层组件（纯逻辑）
// components/documents/NovelCreationForm.tsx
import { useState } from 'react';

export interface NovelCreationData {
  title: string;
  synopsis?: string;
  cover?: File | null;
  selectedKbIds?: string[];
}

export function useNovelCreationForm(initialData?: Partial<NovelCreationData>) {
  const [formData, setFormData] = useState<NovelCreationData>({
    title: '',
    synopsis: '',
    cover: null,
    selectedKbIds: [],
    ...initialData,
  });

  const handleFieldChange = <K extends keyof NovelCreationData>(
    key: K,
    value: NovelCreationData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (file?: File | null) => {
    setFormData(prev => ({ ...prev, cover: file }));
  };

  const reset = () => {
    setFormData({
      title: '',
      synopsis: '',
      cover: null,
      selectedKbIds: [],
    });
  };

  return {
    data: formData,
    setField: handleFieldChange,
    setFile: handleFileUpload,
    reset,
    isValid: formData.title.trim().length > 0,
  };
}
```

```tsx
// Step 2: 提取视图层组件（纯展示）
// components/documents/NovelCoverUpload.tsx
interface NovelCoverUploadProps {
  file?: File | null;
  onFileChange: (file?: File | null) => void;
}

const NovelCoverUpload: React.FC<NovelCoverUploadProps> = ({ file, onFileChange }) => {
  return (
    <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300
                   flex flex-col items-center justify-center cursor-pointer
                   hover:border-accent-secondary hover:bg-surface-hover transition-colors">
      <input
        type="file"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => onFileChange(e.target.files?.[0])}
      />
      {file ? (
        <div className="text-sm text-gray-500">{file.name}</div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-accent-secondary" />
          <span className="text-xs text-gray-500">上传封面</span>
        </>
      )}
    </div>
  );
};
```

```tsx
// Step 3: 模式选择组件
// components/documents/KnowledgeBaseSelector.tsx
interface KnowledgeBaseSelectorProps {
  knowledgeBases: KnowledgeBase[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateNew: () => void;
}

const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  knowledgeBases,
  selectedIds,
  onChange,
  onCreateNew,
}) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        关联知识库
      </span>
      <div className="flex items-center gap-2">
        <select
          className="text-xs border border-gray-200 rounded px-2 py-1"
          value={selectedIds[0] || ''}
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        >
          <option value="">未选择</option>
          {knowledgeBases.map(kb => (
            <option key={kb.id} value={kb.id}>{kb.name}</option>
          ))}
        </select>
        <Button size="sm" variant="outline" rounded="md" onClick={onCreateNew}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
```

```tsx
// Step 4: 知识库创建表单
// components/documents/KnowledgeBaseCreationForm.tsx
interface KnowledgeBaseCreationFormProps {
  onSubmit: (data: { name: string; tags: string; description: string }) => void;
  onCancel: () => void;
}

const KnowledgeBaseCreationForm: React.FC<KnowledgeBaseCreationFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState({ name: '', tags: '', description: '' });

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-sm font-bold text-gray-800 mb-3">添加你的知识库</h4>

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {['世界观', '人物', '设定'].map(tag => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      <Input
        placeholder="知识库名称"
        className="mb-3"
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
      />

      <Textarea
        placeholder="知识库描述/内容..."
        className="flex-1 mb-3"
        value={form.description}
        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
      />

      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          返回
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!form.name.trim()}
          onClick={() => onSubmit(form)}
        >
          <Save className="w-3 h-3" />
          保存
        </Button>
      </div>
    </div>
  );
};
```

```tsx
// Step 5: 模式管理组件
// components/documents/NovelCreationContainer.tsx
interface NovelCreationContainerProps {
  onCancel: () => void;
  onCreate: (data: NovelCreationData) => void;
  onCreateKnowledgeBase: (data: { name: string; tags: string; description: string }) => void;
  existingKnowledgeBases: KnowledgeBase[];
}

const NovelCreationContainer: React.FC<NovelCreationContainerProps> = ({
  onCancel,
  onCreate,
  onCreateKnowledgeBase,
  existingKnowledgeBases,
}) => {
  const [mode, setMode] = useState<'novel' | 'create-kb'>('novel');

  const form = useNovelCreationForm();

  return (
    <div className="relative w-full max-w-2xl bg-surface-white rounded-3xl border border-gray-200 shadow-modal overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50">
        <span className="font-serif text-text-primary font-medium">
          {mode === 'novel' ? '创建新小说' : '新建知识库'}
        </span>
        <Button variant="ghost" size="icon" rounded="full" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex p-6 gap-6">
        {mode === 'novel' ? (
          /* 小说创建模式 */
          <div className="flex gap-6">
            {/* Left: Cover */}
            <div className="w-1/3 flex flex-col gap-4">
              <NovelCoverUpload
                file={form.data.cover}
                onFileChange={form.setFile}
              />
              <Input
                placeholder="小说名"
                variant="underline"
                value={form.data.title}
                onChange={(e) => form.setField('title', e.target.value)}
              />
            </div>

            {/* Right: Synopsis */}
            <div className="flex-1 flex flex-col h-full relative">
              <KnowledgeBaseSelector
                knowledgeBases={existingKnowledgeBases}
                selectedIds={form.data.selectedKbIds || []}
                onChange={(ids) => form.setField('selectedKbIds', ids)}
                onCreateNew={() => setMode('create-kb')}
              />

              <Textarea
                className="flex-1"
                placeholder="请输入小说简介..."
                value={form.data.synopsis}
                onChange={(e) => form.setField('synopsis', e.target.value)}
              />

              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  rounded="full"
                  disabled={!form.isValid}
                  onClick={() => onCreate(form.data)}
                >
                  创建
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* 知识库创建模式 */
          <div className="px-6 py-4 animate-slide-up">
            <KnowledgeBaseCreationForm
              onSubmit={(data) => {
                onCreateKnowledgeBase(data);
                setMode('novel');
              }}
              onCancel={() => setMode('novel')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NovelCreationContainer;
```

**使用方式**:
```tsx
// 在父组件中
import NovelCreationContainer from './components/documents/NovelCreationContainer';

const ParentComponent = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCreateNovel = (data: NovelCreationData) => {
    // 调用 API
    createNovel(data);
    setModalOpen(false);
  };

  const handleCreateKnowledgeBase = (data: { name: string; tags: string; description: string }) => {
    // 调用 API
    createKnowledgeBase(data);
  };

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>新建小说</Button>

      <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
        <NovelCreationContainer
          onCancel={() => setModalOpen(false)}
          onCreate={handleCreateNovel}
          onCreateKnowledgeBase={handleCreateKnowledgeBase}
          existingKnowledgeBases={knowledgeBases}
        />
      </Modal>
    </>
  );
};
```

**重构效果**:
```
重构前（CreateNovelCard）:
- 代码: 290 行
- 职责: 10 多个
- 测试难度: 高
- 复用性: 低

重构后（5 个组件）:
- 总代码: ~150 行（每个 30-50 行）
- 职责清晰（每个 1-2 个）
- 测试难度: 低（可单独测试）
- 复用性: 高（每个都可复用）

优势：
✅ 单一职责（每个组件只做一件事）
✅ 可测试性（可单独测试 useNovelCreationForm）
✅ 可复用性（KnowledgeBaseSelector 可在其他地方使用）
✅ 可维护性（修改知识库选择只需改一个组件）
✅ 可组合性（通过 props 组合不同功能）
✅ 类型安全（TypeScript 接口明确）
```

**优先级**: 🔴 高 | **预计修复时间**: 3-4 小时 | **难度**: 中等

---

### 2.3 过度耦合 ❌【中等】

#### 问题描述
组件之间高度依赖，难以独立使用和测试。

#### 具体表现

**实例：NovelCard 与业务逻辑耦合**
```tsx
NovelCard.tsx:

// 紧密耦合业务操作
const NovelCard: React.FC<NovelCardProps> = ({
  novel,
  isActive = false,
  onEdit,
  onDelete,
  onOpenKnowledgeBase
}) => {
  return (
    <div className="...">
      {/* Mac-style Window Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 group">
        {/* 知识库按钮 - 硬编码样式和逻辑 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenKnowledgeBase?.(novel);
          }}
          className="w-3 h-3 rounded-full bg-success hover:bg-green-600 shadow-sm transition-colors cursor-pointer"
          title="知识库"
        />

        {/* 编辑按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(novel);
          }}
          className="w-3 h-3 rounded-full bg-warning hover:bg-yellow-500 shadow-sm transition-colors cursor-pointer"
          title="编辑"
        />

        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(novel.id);
          }}
          className="w-3 h-3 rounded-full bg-error hover:bg-red-600 shadow-sm transition-colors cursor-pointer"
          title="删除"
        />
      </div>
      ...
    </div>
  );
};

问题分析：
- 按钮样式硬编码在组件中
- 按钮逻辑（e.stopPropagation）重复
- 如果要在其他地方使用 NovelCard，必须接受这些按钮
- 无法自定义按钮（比如添加"分享"按钮）
- 按钮逻辑与卡片展示逻辑耦合
```

**实例：FeatureCard 与 Dashboard 耦合**
```tsx
Dashboard.tsx:

const cards = [
  {
    title: '文件管理',
    icon: <FileText className="w-8 h-8" />,
    rotation: '-rotate-3',
    color: 'bg-white',
    onClick: () => router.push('/documents'),
  },
];

cards.map((card, index) => (
  <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
    <FeatureCard
      title={card.title}
      icon={card.icon}
      rotation={card.rotation}
      color={card.color}
      onClick={card.onClick}
    />
  </div>
));

问题分析：
- Dashboard 负责卡片数据准备
- 数据结构与 FeatureCard props 强耦合
- 如果 FeatureCard props 变化，需要改 Dashboard 和卡片定义
- 动画延迟逻辑分散在 Dashboard 中（不应关心）
```

#### 修复建议

**方案 1: 提取操作栏组件（推荐）**

```tsx
// components/documents/NovelCardActions.tsx
interface NovelCardActionsProps {
  vertical?: boolean;
  className?: string;
  children: React.ReactNode;
}

const NovelCardActions: React.FC<NovelCardActionsProps> = ({
  vertical = false,
  className = '',
  children
}) => {
  return (
    <div
      className={`
        absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity
        ${vertical ? 'flex-col' : 'flex-row'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// 使用示例
const NovelCard: React.FC<NovelCardProps> = ({ novel, isActive, children }) => {
  return (
    <div className="... group ...">
      <NovelCardActions>
        {children}
      </NovelCardActions>
      ...卡片内容...
    </div>
  );
};

// 父组件
<NovelCard novel={novel}>
  <ActionButton
    color="success"
    icon={<ExternalLink />}
    onClick={() => openKnowledgeBase(novel)}
  />
  <ActionButton
    color="warning"
    icon={<Edit />}
    onClick={() => editNovel(novel)}
  />
  <ActionButton
    color="error"
    icon={<Trash />}
    onClick={() => deleteNovel(novel.id)}
  />
</NovelCard>
```

**ActionButton 原子组件**:
```tsx
// components/base/ActionButton.tsx
interface ActionButtonProps {
  color?: 'primary' | 'success' | 'warning' | 'error';
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  color = 'primary',
  icon,
  onClick,
  tooltip,
}) => {
  const colorClasses = {
    primary: 'bg-accent-primary hover:bg-accent-secondary',
    success: 'bg-success hover:bg-success-light',
    warning: 'bg-warning hover:bg-warning-light',
    error: 'bg-error hover:bg-error-light',
  };

  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`
        w-6 h-6 rounded-full
        ${colorClasses[color]}
        shadow-sm transition-all
        flex items-center justify-center
        text-white
        hover:scale-110
      `}
    >
      <span className="w-3 h-3">{icon}</span>
    </button>
  );
};
```

**方案 2: Compound Component 模式（更灵活）**

```tsx
// components/documents/NovelCard/index.tsx
interface NovelCardProps {
  novel: Novel;
  className?: string;
  children?: React.ReactNode;
}

const NovelCardRoot: React.FC<NovelCardProps> = ({ novel, className = '', children }) => {
  return (
    <div className={`relative w-72 h-96 bg-surface-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex flex-col group transition-all duration-500 ${className}`}>
      {children}
    </div>
  );
};

// NovelCard 的子组件
const Content: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex-1 p-5 flex flex-col justify-between bg-surface-white">{children}</div>;
};

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h3 className="text-xl font-serif font-bold text-text-primary mb-2 line-clamp-1">{children}</h3>;
};

const Cover: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  return (
    <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="bg-gray-100">无封面</div>
      )}
    </div>
  );
};

const Actions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
};

// 组合所有子组件
const NovelCard = Object.assign(NovelCardRoot, {
  Content,
  Title,
  Cover,
  Actions,
});

export default NovelCard;

// 使用示例
<NovelCard novel={novel}>
  <NovelCard.Cover src={novel.cover} alt={novel.title} />
  <NovelCard.Actions>
    <ActionButton icon={<ExternalLink />} />
    <ActionButton icon={<Edit />} />
    <ActionButton icon={<Trash />} />
  </NovelCard.Actions>
  <NovelCard.Content>
    <NovelCard.Title>{novel.title}</NovelCard.Title>
    <p className="text-sm text-text-secondary">
      更新字数: {novel.wordCount}
    </p>
  </NovelCard.Content>
</NovelCard>
```

**优势**:
- ✅ 组合灵活（可添加/删除任意子组件）
- ✅ 职责清晰（每个子组件职责单一）
- ✅ 类型安全（TypeScript 支持）
- ✅ 易于扩展（可添加新的子组件）
- ✅ 文档友好（IDE 自动补全）

**优先级**: 🟡 中等 | **预计修复时间**: 2-3 小时 | **难度**: 中等

---

### 2.4 组件层级混乱 ❌【中等】

#### 问题描述
组件层级不明确，包含-组合关系混乱。

#### 具体表现

**实例：Dashboard 组件**
```tsx
Dashboard.tsx:

// Dashboard 包含 FeatureCard，但是否需要包裹 div？
const cards = [
  { title: '文件管理', icon: <FileText />, rotation: '-rotate-3', color: 'bg-white' },
];

cards.map((card, index) => (
  <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
    <FeatureCard
      title={card.title}
      icon={card.icon}
      rotation={card.rotation}
      color={card.color}
      onClick={card.onClick}
    />
  </div>
));

问题分析：
- Dashboard 关心 FeatureCard 的动画延迟逻辑（不该关心）
- 应该由 FeatureCard 或父组件的 CSS 处理动画
- Dashboard 只负责传递数据
```

**实例：Modal 与内容的层级**（参考 KnowledgeBaseModal）

```tsx
// KnowledgeBaseModal.tsx
<div className="fixed inset-0 ...">{/* Backdrop */}</div>
<div className="relative w-full max-w-lg ...">{/* Modal Content */}</div>

<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">{/* Header */}</div>

问题分析：
- Header 是 Modal 的一部分，应该由 Modal 管理
- 如果其他 Modal 也需要 Header，需要重复代码
- 应该由 Modal 组件统一提供 Header 功能
```

#### 修复建议

**方案: 明确组件层级**（容器组件 vs 展示组件）

```tsx
// components/base/Modal.tsx（改进版）
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  closeIcon?: boolean;
  backdrop?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  title,
  size = 'md',
  footer,
  closeIcon = true,
  backdrop = true,
}) => {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {backdrop && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}

      <div className={`relative w-full ${sizeClasses[size]} bg-surface-white rounded-2xl shadow-modal transform transition-all animate-slide-up flex flex-col max-h-[90vh]`}>
        {/* Header */}
        {(title || closeIcon) && (
          <ModalHeader title={title} onClose={onClose} showClose={closeIcon} />
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ModalHeader 子组件
interface ModalHeaderProps {
  title?: React.ReactNode;
  showClose?: boolean;
  onClose?: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, showClose, onClose }) => {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
      {typeof title === 'string' ? (
        <h3 className="text-text-primary font-serif font-semibold">{title}</h3>
      ) : (
        title
      )}
      {showClose && (
        <Button variant="ghost" size="icon" rounded="full" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
```

**使用示例**:
```tsx
// KnowledgeBaseModal 中简化使用
<Modal
  open={open}
  onClose={onClose}
  title="关联知识库"
  size="lg"
  footer={
    <>
      <Button variant="ghost" size="sm">
        取消
      </Button>
      <Button variant="primary" size="sm" onClick={handleConfirm}>
        确认
      </Button>
    </>
  }
>
  <div className="space-y-4">
    {/* 内容直接传递，不关心 header/footer */}
  </div>
</Modal>
```

**优势**:
- ✅ 职责清晰（Modal 管理 header）
- ✅ 代码复用（所有 Modal 统一 header）
- ✅ 一致性（所有 Modal 样式统一）
- ✅ 易于维护（修改 header 样式只需改一处）

**优先级**: 🟡 中等 | **预计修复时间**: 1-2 小时 | **难度**: 低到中等

---

## 📋 组件化优化检查清单

### 基础组件创建（✅ 已完成 - 2025-12-12）
- [x] 创建 `Button` 组件（支持 variant: primary/secondary/outline/ghost/danger + size/rounded）
  - 实现位置: `src/components/base/Button.tsx`
  - 说明: 已实现统一的 Button 组件，替换项目中所有分散的按钮实现

- [x] 创建 `Input` 组件（支持 leftIcon/rightIcon，error 状态）
  - 实现位置: `src/components/base/Input.tsx`
  - 说明: 已实现标准化 Input 组件，支持图标插槽

- [x] 创建 `SearchBar` 组件（防抖、自动搜索）
  - 实现位置: `src/components/base/SearchBar.tsx`
  - 说明: 已消除之前的重复实现版本，统一位于 base 目录

- [x] 创建 `BottomInput` 组件（底部通用输入框，已移除 5 个分散组件）
  - 实现位置: `src/components/base/BottomInput.tsx`
  - 说明: 已完全替代原有的 Input/SendButton/ChatTextarea 等分散组件

- [ ] 创建 `Modal` 组件（支持 header/footer）- 待实现
  - 说明: 需要重构 KnowledgeBaseModal，提取通用 Modal 组件

- [ ] 创建 `Card` 组件（基础容器）- 低优先级

- [ ] 创建 `Badge` 组件（状态标记）- 低优先级

- [ ] 创建 `Avatar` 组件（头像）- 低优先级

- [ ] 创建 `ActionButton` 组件（操作按钮）- 待实现
  - 说明: 用于 NovelCard 的按钮解耦

- [ ] 创建 `Textarea` 组件（多行文本）- 低优先级

### 业务组件重构
- [ ] 重构 `CreateNovelCard` → `NovelCreationContainer` + 子组件 - **P0 优先级**
  - 当前状态: 仍耦合严重（190行，两种模式）
  - 问题: 同时处理小说创建和知识库创建，8+ 个状态变量
  - 建议: 按 2.2 节方案拆分为 5 个子组件

- [x] 创建 `QuickCreateMenu` 组件（便捷导航）- ✅ 已完成
  - 实现位置: `src/components/Home/QuickCreateMenu.tsx`
  - 说明: 2025-12-12 新增，支持空白/模板/导入三种方式

- [x] 创建 `AIAssistantSidebar` - ✅ 已完成（MVP）
  - 实现位置: `src/components/ai-assistant/AIAssistantSidebar.tsx`
  - 已集成 ChatHistory、ChatMessage 和 BottomInput
  - 当前限制: 使用 Mock 数据，待接入真实 API

- [ ] 重构 `NovelCard` → Compound Component 模式 - 待优化
  - 当前状态: 按钮样式仍硬编码在组件内部
  - 问题: 无法自定义操作（如添加"分享"按钮）
  - 建议: 参考 2.3 节的 ActionButton + NovelCardActions 方案

### 组合模式应用
- [x] 应用 Custom Hook 模式（数据操作）- 部分实现
  - 示例: 在 2.2 节中提出的 useNovelCreationForm Hook 架构

- [ ] 应用 Render Props 模式（流式数据）- 待评估

- [ ] 应用 Context 模式（UI 状态）- 待评估

- [ ] 应用 Compound Component 模式（表单、卡片）- 待实现
  - 主要应用: NovelCard 重构

### 测试与验证
- [ ] 为原子组件编写单元测试（Storybook）
- [ ] 为 Hook 编写测试
- [ ] 验证组件在不同场景下的表现
- [ ] 检查可访问性（ARIA 属性）
- [ ] 检查键盘导航

---

## 🔄 更新历史

| 日期 | 版本 | 更新内容 | 更新者 |
|-----|------|---------|--------|
| 2025-12-12 | v1.0 | 创建组件化优化文档 | Agent |
| 2025-12-12 | v1.1 | 检查并标记已解决项：（1）底部通用输入框 ✅（2）AI助手侧边栏 ✅（3）SearchBar 统一 ✅（4）原子组件（Button/Input/BottomInput）✅（5）QuickCreateMenu ✅ | Agent |

---

**最后更新**: 2025-12-12
**维护者**: Agent 开发团队
**文档状态**: 活跃维护中

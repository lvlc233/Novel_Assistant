我来帮你将这个网页的内容转化为 Markdown 格式。首先让我获取网页内容。以下是该网页内容的 Markdown 格式版本：

# 定制 Copilot UI 外观

CopilotKit 提供了多种方式来定制 Copilot UI 组件的颜色和结构。

- CSS 变量
- 自定义 CSS
- 自定义图标
- 自定义标签

如果你想同时定制 Copilot UI 的样式和功能，也可以尝试以下方式：

- 自定义子组件
- 完全无头 UI

## CSS 变量（最简单）

更改 Copilot UI 组件所用颜色的最简单方法是覆盖 CopilotKit CSS 变量。

将鼠标悬停在下面的交互式 UI 元素上，即可查看可用的 CSS 变量。

关闭 CopilotKit

嗨，你好！👋 我可以帮你创建关于任何主题的演示文稿。

你好，CopilotKit！

找到合适的变量后，你可以导入 `CopilotKitCSSProperties`，只需将 CopilotKit 包裹在一个 div 中并覆盖 CSS 变量即可。

```javascript
import { CopilotKitCSSProperties } from "@copilotkit/react-ui";

<div
  style={
    {
      "--copilot-kit-primary-color": "#222222",
    } as CopilotKitCSSProperties
  }
>
  <CopilotSidebar .../>
</div>
```

### 参考

| CSS 变量 | 说明 |
| --- | --- |
| `--copilot-kit-primary-color` | 主要品牌/操作颜色 - 用于按钮、交互元素 |
| `--copilot-kit-contrast-color` | 与主色形成对比的颜色 - 用于主色元素上的文本 |
| `--copilot-kit-background-color` | 主页面/容器背景色 |
| `--copilot-kit-secondary-color` | 次要背景 - 用于卡片、面板、凸起表面 |
| `--copilot-kit-secondary-contrast-color` | 主要内容的主要文本颜色 |
| `--copilot-kit-separator-color` | 分隔线和容器的边框颜色 |
| `--copilot-kit-muted-color` | 用于禁用/非活动状态的静音颜色 |

## 自定义 CSS

除了自定义颜色外，CopilotKit CSS 的结构还允许通过 CSS 类轻松自定义。

globals.css

```css
.copilotKitButton {
  border-radius: 0;
}

.copilotKitMessages {
  padding: 2rem;
}

.copilotKitUserMessage {
  background: #007AFF;
}
```

### 参考

如需查看 CopilotKit 中使用的样式和类的完整列表，请单击此处。

| CSS 类 | 说明 |
| --- | --- |
| `.copilotKitMessages` | 所有聊天消息的主容器，具有滚动行为和间距 |
| `.copilotKitInput` | 文本输入容器，带有输入区域和发送按钮 |
| `.copilotKitUserMessage` | 用户消息的样式，包括背景、文本颜色和气泡形状 |
| `.copilotKitAssistantMessage` | AI 响应的样式，包括背景、文本颜色和气泡形状 |
| `.copilotKitHeader` | 聊天窗口顶部栏，包含标题和控件 |
| `.copilotKitButton` | 主聊天切换按钮，具有悬停和活动状态 |
| `.copilotKitWindow` | 根容器，定义整个聊天窗口的尺寸和位置 |
| `.copilotKitMarkdown` | 渲染的 Markdown 内容的样式，包括列表、链接和引用 |
| `.copilotKitCodeBlock` | 代码片段容器，带有语法高亮和复制按钮 |
| `.copilotKitChat` | 基础聊天布局容器，处理定位和尺寸 |
| `.copilotKitSidebar` | 侧边栏聊天模式的样式，包括宽度和动画 |
| `.copilotKitPopup` | 弹出聊天模式的样式，包括位置和动画 |
| `.copilotKitButtonIcon` | 主聊天切换按钮内的图标样式 |
| `.copilotKitButtonIconOpen` `.copilotKitButtonIconClose` | 聊天打开/关闭时的图标状态 |
| `.copilotKitCodeBlockToolbar` | 代码块的顶部栏，带有语言和复制控件 |
| `.copilotKitCodeBlockToolbarLanguage` | 代码块工具栏中的语言标签样式 |
| `.copilotKitCodeBlockToolbarButtons` | 代码块操作按钮的容器 |
| `.copilotKitCodeBlockToolbarButton` | 代码块工具栏中的单个按钮样式 |
| `.copilotKitSidebarContentWrapper` | 侧边栏模式内容的内部容器 |
| `.copilotKitInputControls` | 输入区域按钮和控件的容器 |
| `.copilotKitActivityDot1` `.copilotKitActivityDot2` `.copilotKitActivityDot3` | 动画输入指示点 |
| `.copilotKitDevConsole` | 开发调试控制台容器 |
| `.copilotKitDevConsoleWarnOutdated` | 过时开发控制台的警告样式 |
| `.copilotKitVersionInfo` | 版本信息显示样式 |
| `.copilotKitDebugMenuButton` | 调试菜单切换按钮样式 |
| `.copilotKitDebugMenu` | 调试选项菜单容器 |
| `.copilotKitDebugMenuItem` | 单个调试菜单选项样式 |

## 自定义字体

你可以通过更新 CopilotKit 中使用的各种 CSS 类的 `fontFamily` 属性来自定义字体。

globals.css

```css
.copilotKitMessages {
  font-family: "Arial, sans-serif";
}

.copilotKitInput {
  font-family: "Arial, sans-serif";
}
```

### 参考

你可以更新主要内容类以更改各种组件的字体系列。

| CSS 类 | 说明 |
| --- | --- |
| `.copilotKitMessages` | 所有消息的主容器 |
| `.copilotKitInput` | 输入字段 |
| `.copilotKitMessage` | 所有聊天消息的基础样式 |
| `.copilotKitUserMessage` | 用户消息 |
| `.copilotKitAssistantMessage` | AI 响应 |

## 自定义图标

你可以通过将 `icons` 属性传递给 `CopilotSidebar`、`CopilotPopup` 或 `CopilotChat` 组件来自定义图标。

```javascript
<CopilotChat
  icons={{
    // 在此处使用你自己的图标 – 任何 React 节点
    openIcon: <YourOpenIconComponent />,
    closeIcon: <YourCloseIconComponent />,
  }}
/>
```

### 参考

| 图标 | 说明 |
| --- | --- |
| `openIcon` | 用于打开聊天按钮的图标 |
| `closeIcon` | 用于关闭聊天按钮的图标 |
| `headerCloseIcon` | 用于标题中关闭聊天按钮的图标 |
| `sendIcon` | 用于发送按钮的图标 |
| `activityIcon` | 用于活动指示器的图标 |
| `spinnerIcon` | 用于旋转器的图标 |
| `stopIcon` | 用于停止按钮的图标 |
| `regenerateIcon` | 用于重新生成按钮的图标 |
| `pushToTalkIcon` | 用于按键说话的图标 |

## 自定义标签

要自定义标签，请将 `labels` 属性传递给 `CopilotSidebar`、`CopilotPopup` 或 `CopilotChat` 组件。

```javascript
<CopilotChat
  labels={{
    initial: "你好！我今天能帮你什么？",
    title: "我的 Copilot",
    placeholder: "问我任何问题！",
    stopGenerating: "停止",
    regenerateResponse: "重新生成",
  }}
/>
```

### 参考

| 标签 | 说明 |
| --- | --- |
| `initial` | 在聊天窗口中显示的初始消息 |
| `title` | 在标题中显示的标题 |
| `placeholder` | 在输入中显示的占位符 |
| `stopGenerating` | 在停止按钮上显示的标签 |
| `regenerateResponse` | 在重新生成按钮上显示的标签 |
# Tailwind CSS 使用规范文档

本文档为 Novel Assistant 前端项目的 Tailwind CSS 使用规范，供所有 Agent 开发和维护时使用。

## 项目配置

### 版本信息
- **Tailwind CSS**: v4.x
- **安装方式**: 通过 `npm install` 自动安装
- **配置文件**: `tailwind.config.ts` (位于项目根目录)

### 核心配置文件

#### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主色调
        'accent-primary': '#2C2420',
        'accent-secondary': '#B08D6F',

        // 背景色
        'surface-primary': '#FDFBF7',
        'surface-secondary': '#F9F6F1',
        'surface-hover': '#F5EFE6',

        // 文字色
        'text-primary': '#2C2420',
        'text-secondary': '#8A817C',

        // Border 和 Shadow
        'border-primary': '#EFEBE5',
        'shadow-primary': 'rgba(44, 36, 32, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'card-soft': '0 4px 20px rgba(44, 36, 32, 0.05)',
        'card-hover': '0 12px 30px rgba(0,0,0,0.06)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    },
  },
  plugins: [],
} satisfies Config;
```

#### `src/app/globals.css`
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --accent-primary: #2C2420;
  --accent-secondary: #B08D6F;
  --surface-primary: #FDFBF7;
  --surface-secondary: #F9F6F1;
  --surface-hover: #F5EFE6;
  --text-primary: #2C2420;
  --text-secondary: #8A817C;
  --border-primary: #EFEBE5;
  --card-shadow: rgba(44, 36, 32, 0.05);
}

@layer utilities {
  /* 动画工具类 */
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }

  .animate-slide-up {
    animation: slideUp 0.5s ease-out forwards;
  }

  .perspective-1000 {
    perspective: 1000px;
  }

  .rotate-y-12 {
    transform: rotateY(12deg);
  }

  .-rotate-y-12 {
    transform: rotateY(-12deg);
  }

  .writing-vertical-rl {
    writing-mode: vertical-rl;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 基础使用规范

### ❌ 禁止事项

1. **禁止直接硬编码颜色值**
```tsx
<!-- ❌ 错误示范 -->
<div className="bg-[#F9F6F1] text-[#8A817C]">

<!-- 原因：颜色值散落在代码中，难以维护 -->
```

2. **禁止过长的行内类名**
```tsx
<!-- ❌ 错误示范 -->
<div className="mb-5 p-4 rounded-full bg-[#F9F6F1] text-[#8A817C] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#F5EFE6] group-hover:text-[var(--accent-primary)]">

<!-- 原因：可读性差，难以维护 -->
```

3. **禁止重复的长类名组合**
```tsx
<!-- ❌ 错误示范 -->
<!-- 在多个组件中重复以下长类名 -->
<div className="flex items-center justify-between p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">

<!-- 原因：违反 DRY 原则 -->
```

### ✅ 推荐实践

#### 1. 使用配置好的主题颜色
```tsx
✅ 正确示范
div className="bg-surface-secondary text-text-secondary">

<!-- 配置好的颜色，集中管理 -->
```

#### 2. 使用简化的类名组合
```tsx
✅ 正确示范
<div className="flex items-center justify-between p-4">

<!-- 简短、清晰、易读 -->
```

#### 3. 提取重复样式为组件
```tsx
// ✅ 正确示范
// components/common/Card.tsx
export const Card = ({ children, className = '' }) => (
  <div className={`p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow ${className}`}>
    {children}
  </div>
);

// 使用时
<Card>内容</Card>
<Card className="bg-red-50">特殊样式</Card>
```

#### 4. 使用 @layer 提取复杂样式
```css
/* ✅ 正确示范 */
/* 在 globals.css 中 */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-accent-primary text-white rounded-lg
           hover:bg-accent-secondary transition-colors;
  }

  .icon-container {
    @apply mb-5 p-4 rounded-full bg-surface-secondary text-text-secondary
           transition-all duration-300 hover:scale-110 hover:bg-surface-hover hover:text-accent-primary;
  }
}

// 使用时
<button className="btn-primary">点击我</button>
<div className="icon-container">...</div>
```

## 颜色系统

### 主题颜色

| 颜色名称 | Tailwind 类名 | Hex 值 | CSS 变量 | 使用场景 |
|---------|--------------|--------|---------|---------|
| 主色调1 | `accent-primary` | #2C2420 | `--accent-primary` | 主要按钮、重要文字 |
| 主色调2 | `accent-secondary` | #B08D6F | `--accent-secondary` | 悬停状态、次要按钮 |
| 背景色1 | `surface-primary` | #FDFBF7 | `--surface-primary` | 页面背景 |
| 背景色2 | `surface-secondary` | #F9F6F1 | `--surface-secondary` | 卡片背景、区域背景 |
| 背景色3 | `surface-hover` | #F5EFE6 | `--surface-hover` | 悬停背景 |
| 文字色1 | `text-primary` | #2C2420 | `--text-primary` | 主要文字 |
| 文字色2 | `text-secondary` | #8A817C | `--text-secondary` | 次要文字、描述 |
| 边框色 | `border-primary` | #EFEBE5 | `--border-primary` | 边框、分割线 |

### 使用示例

```tsx
// 主要按钮
<button className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors">
  主要按钮
</button>

// 卡片容器
<div className="bg-surface-secondary border border-border-primary rounded-2xl shadow-card-soft p-6">
  <h3 className="text-text-primary font-semibold mb-2">标题</h3>
  <p className="text-text-secondary">描述文字</p>
</div>

// 悬停效果
<div className="bg-surface-secondary hover:bg-surface-hover transition-colors cursor-pointer">
  悬停查看效果
</div>
```

## 间距系统

使用 Tailwind 默认的间距系统（基于 0.25rem = 4px）：

| 类名 | 尺寸 | 使用场景 |
|-----|------|---------|
| `p-2` / `m-2` | 8px | 小间距、紧凑布局 |
| `p-4` / `m-4` | 16px | 标准间距、卡片内边距 |
| `p-6` / `m-6` | 24px | 较大间距、区块间距 |
| `p-8` / `m-8` | 32px | 大间距、页面边距 |
| `gap-4` | 16px | 网格/弹性布局间距 |
| `gap-6` | 24px | 卡片网格间距 |

### 示例

```tsx
// 卡片内边距 16px
<div className="p-4">

// 外边距底部 16px
<div className="mb-4">

// 网格间距 24px
<div className="grid grid-cols-3 gap-6">
```

## 布局规范

### Flexbox 布局

```tsx
// 水平居中
<div className="flex items-center">...</div>

// 垂直居中
<div className="flex justify-center">...</div>

// 两端对齐
<div className="flex justify-between items-center">...</div>

// 垂直排列
<div className="flex flex-col gap-4">...</div>
```

### Grid 布局

```tsx
// 2列响应式网格
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// 3列网格
<div className="grid grid-cols-3 gap-6">

// 自适应卡片网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
```

### 响应式断点

| 断点前缀 | 尺寸 | 使用场景 |
|---------|------|---------|
| `sm:` | ≥640px | 小屏适配 |
| `md:` | ≥768px | 平板适配 |
| `lg:` | ≥1024px | 桌面适配 |
| `xl:` | ≥1280px | 大屏适配 |

```tsx
// 移动设备单列，桌面设备双列
<div className="grid grid-cols-1 md:grid-cols-2">

// 移动设备隐藏，桌面显示
<div className="hidden lg:block">
```

## 动画与过渡

### 项目自定义动画

在 `globals.css` 中已定义：

```css
.animate-fade-in   /* 淡入动画 */
.animate-slide-up /* 上滑动画 */
.transition-timing-function-smooth /* 平滑过渡 */
```

### 使用示例

```tsx
// 淡入动画
<div className="animate-fade-in">

// 延迟动画
<div className="animate-fade-in" style={{ animationDelay: '100ms' }}>

// 平滑过渡
<div className="transition-all duration-300 transition-timing-function-smooth">

// 悬停效果
<div className="hover:scale-105 hover:shadow-lg transition-all duration-300">
```

## 组件开发规范

### 按钮组件示例

```tsx
// components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-accent-primary text-white hover:bg-accent-secondary focus:ring-accent-primary',
    secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-hover focus:ring-accent-secondary',
    outline: 'border border-border-primary text-text-primary hover:bg-surface-secondary focus:ring-accent-primary',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

### 卡片组件示例

```tsx
// components/common/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card = ({ children, className = '', hoverable = false }: CardProps) => {
  return (
    <div
      className={`
        bg-surface-secondary border border-border-primary rounded-2xl shadow-card-soft p-6
        ${hoverable ? 'hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
```

## 调试与优化

### 1. 检查生成的 CSS

查看 `npm run build` 后的 `.next/static/css` 文件，确认只包含使用的样式。

### 2. 清理未使用的样式

```bash
# 项目已配置 PurgeCSS（通过 Tailwind 内置）
# 只会在生产环境移除未使用的样式
```

### 3. 避免样式冲突

```tsx
// 使用更具体的类名
<div className="bg-surface-primary">

// 而不是通用的
<div className="bg-white">  <!-- 避免使用 -->
```

## 常见问题

### Q: 我可以使用内联样式吗？

A: 尽量避免，优先使用 Tailwind 类。特殊情况下可以使用内联样式：

```tsx
// 允许的例外情况（动态值）
<div style={{ width: `${progress}%` }}>

// 允许的例外情况（CSS 变量不支持）
<div style={{ '--custom-hue': hue }}>
```

### Q: 如何处理复杂动画？

A: 在 `globals.css` 中定义：

```css
@layer utilities {
  .animate-bounce-in {
    animation: bounceIn 0.5s ease-out;
  }
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Q: 如何添加新颜色？

A: 1. 添加到 `tailwind.config.ts` 的 `colors` 中
   2. 添加到 `globals.css` 的 `:root` 中
   3. 更新本文档的颜色表

## 检查清单

在提交代码前，请检查：

- [ ] 没有硬编码的颜色值（如 `bg-[#F9F6F1]`）
- [ ] 没有过长的行内类名（超过 5-6 个类）
- [ ] 重复的样式已提取为组件或工具类
- [ ] 使用了主题配置中的颜色名称
- [ ] 响应式断点使用正确
- [ ] 动画和过渡使用项目定义的类
- [ ] 特殊值已添加到 `tailwind.config.ts`

## 参考资源

- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Tailwind CSS v4 迁移指南](https://tailwindcss.com/docs/upgrade-guide)
- 项目中的示例组件：`src/components/Home/FeatureCard.tsx`

---

**最后更新**: 2025-12-12
**维护者**: Agent 开发团队
**版本**: v1.0

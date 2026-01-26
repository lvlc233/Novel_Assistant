# Frontend Runtime Error Fix Log (Infinite Loop)

**时间**: 2026-01-25 17:06
**目标**: 修复 "Maximum update depth exceeded" 运行时错误。
**变更范围**: `src/contexts/SlotContext.tsx`

## 问题分析

用户报告控制台出现 "Maximum update depth exceeded" 错误。
经排查，该错误源于 `SlotInjector` 组件与 `SlotContext` 之间的无限循环更新。

1.  `SlotInjector` 组件在 `useEffect` 中调用 `registerSlot` 注册插槽内容。
2.  `useEffect` 依赖于 `registerSlot` 方法。
3.  在原 `SlotContext` 实现中，`registerSlot` 方法在每次 `SlotProvider` 渲染时都会重新创建（未 memoize）。
4.  `registerSlot` 调用会导致 `SlotProvider` 状态更新 (`setSlots`)，从而触发 `SlotProvider` 重新渲染。
5.  `SlotProvider` 重新渲染导致 `registerSlot` 引用发生变化。
6.  `registerSlot` 引用变化导致 `SlotInjector` 的 `useEffect` 再次执行。
7.  形成死循环：Render -> Effect -> State Update -> Render -> New Function Ref -> Effect ...

## 解决方案

1.  **稳定化 Context 方法**: 使用 `useCallback` 包裹 `registerSlot`、`unregisterSlot` 和 `getSlotItems`，确保其引用稳定。
2.  **Memoize Context Value**: 使用 `useMemo` 包裹传递给 `SlotContext.Provider` 的 `value` 对象，避免不必要的 Context 更新通知。
3.  **优化 `registerSlot` 逻辑**: 允许更新已存在的 Slot Item（通过 ID 匹配），而不是直接忽略，以支持动态内容更新。

## 变更代码

```typescript
// src/contexts/SlotContext.tsx

// 使用 useCallback 稳定方法引用
const registerSlot = useCallback((slotId: string, item: SlotItem) => {
  setSlots((prev) => {
    // ...逻辑优化，支持更新
  });
}, []);

// 使用 useMemo 稳定 Context Value
const contextValue = useMemo(() => ({
  registerSlot,
  unregisterSlot,
  getSlotItems
}), [registerSlot, unregisterSlot, getSlotItems]);

return (
  <SlotContext.Provider value={contextValue}>
    {children}
  </SlotContext.Provider>
);
```

## 验证结果

修复后，`registerSlot` 引用保持稳定，`SlotInjector` 的 `useEffect` 仅在 `children` 或其他属性真正变化时执行，打破了无限循环。

## 提交人
FrontendAgent(react)

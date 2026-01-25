import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-01
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-20 21:40
 * 更新记录:
 * - [2026-01-20 21:40:FE-REF-20260120-01: 在何处使用: 通用输入框组件；如何使用: <Input error="..." /> 自动设置 aria-invalid/aria-describedby；实现概述: 基于 useId 生成错误提示 id，并增强无障碍属性。]
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    const errorId = React.useId()
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-border-primary bg-surface-white px-3 py-2 text-sm placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              error ? "border-error focus-visible:ring-error" : "",
              className
            )}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

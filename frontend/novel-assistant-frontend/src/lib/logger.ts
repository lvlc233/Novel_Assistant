/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-01
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-20 21:40
 * 更新记录:
 * - [2026-01-20 21:40:FE-REF-20260120-01: 在何处使用: 全前端替代 console.* 直接调用；如何使用: import { logger } from "@/lib/logger" 后调用 logger.error/info/debug；实现概述: 生产环境静默，开发环境透传到 console。]
 */

type LoggerArgs = readonly unknown[]

const isProduction = process.env.NODE_ENV === "production"

export const logger = {
  debug: (...args: LoggerArgs) => {
    if (isProduction) return
    console.debug(...args)
  },
  info: (...args: LoggerArgs) => {
    if (isProduction) return
    console.info(...args)
  },
  warn: (...args: LoggerArgs) => {
    if (isProduction) return
    console.warn(...args)
  },
  error: (...args: LoggerArgs) => {
    if (isProduction) return
    console.error(...args)
  },
}

export class UINode {
  static _path: string[] = [];

  static getPath(): string {
    // 简单的实现：类名转小写，用 / 连接
    // 在实际运行时，由于构建混淆，类名可能会变。
    // 所以最好是手动指定，或者在 Schema 中定义常量。
    // 这里我们仅作为类型定义和逻辑结构的参考，实际值在 schema.ts 中定义
    return '';
  }
}

export class Page extends UINode {}
export class Slot extends UINode {}
export class Component extends UINode {}

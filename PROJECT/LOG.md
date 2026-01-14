任意格式,推荐由管理员/MaterAgent生成一份格式: 推荐至少包括以下内容:

- 操作人
- 操作时间
- 操作内容
- 操作结果:(推荐指定Agent在失败指定若干次后记录操作结果并由于引导Agent从新的角度从头构建某个模块--->这通常对于Agent总是无法解决某个问题而有效。)

项目级别的Log推荐为管理员的操作记录,例如修改代码,修改配置文件,修改环境变量等通常Agent难以感知的内容。

若修改内容可以被git追踪,也可交给MaterAgent来生成记录。

---
- 操作人: MasterAgent (by Trae)
- 操作时间: 2026年01月14日 11:48
- 操作内容: 为全项目补充英文文档，包括 light/AGENT 下所有 Agent 的 LOG 和 MEMORY 文档，以及 full/example 下的深层文档。更新了根目录 README.md 和 README.zh-CN.md。
- 操作结果: 完成

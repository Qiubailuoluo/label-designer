# 项目说明文档索引

本目录包含项目架构、接口约定与业务模块说明，便于快速理解项目逻辑。

| 文档 | 内容 |
|------|------|
| [01-architecture-and-tech-stack.md](./01-architecture-and-tech-stack.md) | 项目整体架构、技术栈、目录结构、路由与鉴权 |
| [02-auth-api-design.md](./02-auth-api-design.md) | 登录/注册/登出设计，接口请求与响应格式（ApiResponse） |
| [03-template-module-design.md](./03-template-module-design.md) | 模板设置模块：文件架构、设计器组成、模板接口（列表/加载/保存/删除）及数据格式 |
| [04-connect-print-module.md](./04-connect-print-module.md) | 连接打印模块：API 使用、文件结构、ZPL 生成逻辑、占位符与 RFID、后续扩展应在哪里加代码 |
| [connect-print-extension-handover.md](./connect-print-extension-handover.md) | **连接打印扩展交接**：页面与扩展 postMessage 契约、本地打印服务接口、实现与部署说明（云部署必读） |
| [template-api-format.md](./template-api-format.md) | 模板保存/加载与后端对接的数据格式（config、elements、customVariableNames、dataField、RFID 与 ZPL） |

**建议阅读顺序**：01 → 02 → 03 → template-api-format → 04；云部署需打印时阅读 connect-print-extension-handover。

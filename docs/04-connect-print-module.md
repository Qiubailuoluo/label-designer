# 4. 连接打印模块：API、文件结构、ZPL 逻辑与扩展指引

## 4.1 模块职责

- 选择连接方式（USB / TCP）并配置参数。  
- 选择已保存的模板，展示其可填变量。  
- 通过 Excel 导入批量数据，将表头列与模板变量做「列绑定」。  
- 根据模板生成 ZPL（含占位符 `{{变量名}}`），并用 Excel 某一行做「模拟数据」预览；批量时可按行替换占位符得到多条 ZPL。  
- 本地打印机列表（占位，需配合打印插件扩充）。  

**注意**：连接打印页**不提供**独立的打印 HTTP API，而是复用「模板设置」的接口获取模板；ZPL 完全在前端生成，发送到打印机由前端或本地插件负责。

## 4.2 文件架构

```
src/views/connect-print/
├── ConnectPrint.vue        # 页面：连接区、模板选择、Excel、列绑定、ZPL 展示、模拟行
├── css/
│   └── connect-print.css    # 页面样式
└── utils/
    └── zpl-generator.ts    # ZPL 生成核心：模板→ZPL、变量收集、占位符替换、图片缓存
```

- **ConnectPrint.vue**：  
  - 从 `@/views/label-designer/services/api` 引入 `getTemplateList`、`loadTemplate`（类型 `TemplateListItem`、`LoadedTemplate`），即复用模板列表与模板详情接口。  
  - 从 `./utils/zpl-generator` 引入 `templateToZPL`、`collectFillableVariables`、`buildImageZPLCache`、`substituteVariables`、`isRfidField` 等。  
  - 状态包括：连接类型与配置、选中模板 id、加载后的模板与变量列表、Excel 文件名/表头/行、变量→列绑定、模拟行索引；离开页时写入 `localStorage`（key：`connectPrintCache`），进入时若未过期则恢复；登出时清除该缓存。

- **zpl-generator.ts**：  
  - 只依赖「模板数据结构」（来自 label-designer 的 types 与 LoadedTemplate），不直接发请求。  
  - 输入：画布配置 + 元素列表（+ 可选图片 ZPL 缓存）；输出：ZPL 字符串、可填变量列表、占位符替换结果等。

## 4.3 API 使用（请求/响应）

连接打印模块**没有**单独的打印 API，使用的接口与「模板设置」一致：

| 用途 | 接口 | 说明 |
|------|------|------|
| 模板列表 | `GET /api/templates` | 与模板列表页相同，见 [03-模板设置模块](./03-template-module-design.md) |
| 模板详情 | `GET /api/templates/:id` | 与设计器加载相同，返回含 config.elements、config.customVariableNames 的完整模板 |

请求头、baseURL、统一响应格式与项目其他接口一致；Token 由全局 Axios 拦截器附加。  
若后续增加「下发打印任务」等接口，建议在 `src/api/` 下新增如 `print.ts`，在 ConnectPrint 中调用，而不是改模板接口。

## 4.4 ZPL 生成逻辑（核心流程）

### 4.4.1 数据流概览

1. 用户在选择模板后，前端用 `loadTemplate(id)` 拿到 `LoadedTemplate`（含 config、elements、customVariableNames）。  
2. 用 **collectFillableVariables(elements)** 得到「可填变量」列表（文本/变量/条码的 dataField；无 dataField 的条码用「条码」「条码_2」…）。  
3. **EPC、TID、User Data** 视为 RFID 变量，由打印机从标签读取，**不**参与 Excel 列绑定；连接打印页的「列绑定」只展示 **bindableVariables**（即从 collectFillableVariables 中过滤掉 isRfidField 的项）。  
4. 用 **templateToZPL(config, elements, options)** 生成整段 ZPL：  
   - 普通变量输出为占位符 `{{变量名}}`（options.variablePlaceholder 为 true 时）；  
   - RFID 变量输出为 `^RFR,...^FNn^FS` 与 `^FNn` 引用；  
   - 图片需先通过 **buildImageZPLCache(elements, config)** 得到 imageZPLCache，再传入 templateToZPL。  
5. **模拟数据**：取当前 Excel 的某一行（simulateRowIndex），按列绑定得到 `vars`，用 **substituteVariables(zpl, vars)** 得到一条可预览的 ZPL。  
6. **批量**：对每一行 Excel 用同一套列绑定做 substituteVariables，得到多条 ZPL（逻辑可用 zpl-generator 中的 **batchZPLFromRows**）。

### 4.4.2 关键函数（zpl-generator.ts）

| 函数 | 作用 |
|------|------|
| **templateToZPL(config, elements, options)** | 根据画布与元素生成完整 ZPL（^XA…^XZ）；支持占位符、RFID、图片（需 imageZPLCache）。 |
| **collectFillableVariables(elements)** | 返回模板中所有可填变量名列表（含 RFID 与用户变量、条码占位名）。 |
| **buildImageZPLCache(elements, config)** | 异步生成所有图片元素的 ^GFA 数据，供 templateToZPL 使用。 |
| **substituteVariables(zpl, vars)** | 将 ZPL 中 `{{变量名}}` 替换为 vars 中的值。 |
| **isRfidField(name)** | 判断是否为 EPC/TID/User Data。 |
| **mmToDots(mm, dpi)** | 毫米转点距，用于 ^FO、^PW、^LL 等。 |

RFID 在 ZPL 中的约定：  
- 先输出 `^RS8`，再按需 `^RFR,E,0,24,1^FN1^FS`（EPC）、`^RFR,H,0,12,1^FN2^FS`（TID）、`^RFR,U,0,32,1^FN3^FS`（User Data）。  
- 文本/变量/条码若绑定到上述字段，则输出 `^FN1`/`^FN2`/`^FN3`，不再用 `{{...}}`。

### 4.4.3 占位符与替换

- 占位符格式：`{{变量名}}`，例如 `{{变量1}}`、`{{条码}}`。  
- 替换时由 **substituteVariables** 根据 `vars[变量名]` 填入，未提供的变量替换为空串；内部会对 `^`、`\` 等做 ZPL 要求的转义。

## 4.5 后续扩充：应在哪里加代码

| 需求 | 建议位置 | 说明 |
|------|----------|------|
| 新增/修改 ZPL 指令或元素类型 | `connect-print/utils/zpl-generator.ts` | 在 templateToZPL 的 switch(el.type) 中增加或修改 case；新变量类型在 collectFillableVariables 中一并收集。 |
| 新 RFID 字段或 ^RFR 规范 | `zpl-generator.ts` | 修改 RFID_FIELD_NAMES、RFID_ZPL_MAP 及 templateToZPL 中输出 ^RFR/^FN 的逻辑。 |
| 连接打印页的新 UI、新状态 | `ConnectPrint.vue` | 在 template 与 script 中扩展；若需持久化，在 saveConnectPrintCache/loadConnectPrintCache 中增加字段。 |
| 调用后端「下发打印」等新接口 | 新建 `src/api/print.ts` 或类似 | 在 ConnectPrint 中引入并调用，保持模板接口仅负责模板 CRUD。 |
| 本地打印机发现/选择（USB/驱动） | ConnectPrint.vue + 可选插件或 native 桥 | 当前 refreshPrinters/selectPrinter 为占位，实际列表需由本地打印插件或系统 API 提供后在此对接。 |
| 连接参数校验、TCP 测试连接等 | ConnectPrint.vue 或 `connect-print/utils/` 下新建 | 例如新建 `connection.ts` 做校验与测试，Vue 中调用。 |

保持「模板数据与 API」与「ZPL 生成」分离：模板来自 label-designer 的 types 与 api；ZPL 只依赖这些数据结构，便于单测与复用。

---

以上四份文档与 [template-api-format.md](./template-api-format.md) 一起，可快速理解项目整体架构、认证、模板模块与连接打印模块的逻辑与扩展方式。

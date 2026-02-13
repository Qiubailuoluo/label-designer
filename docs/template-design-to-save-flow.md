# 从设计模板到请求后端保存：完整链路与说明

本文档详细说明「在设计器中完成模板设计后，到向后端发起保存请求」的**整条链路**、**功能设计**、**接口内容**与**数据格式**，便于前后端对齐与联调。

---

## 一、整体链路概览

```
用户进入设计器 → 编辑画布与元素 → 点击「保存」→ 前端组装请求体 → POST /api/templates/save → 后端落库 → 返回 id
```

| 阶段         | 说明 |
|--------------|------|
| **入口**     | 模板列表页点击「新建」→ `/label-designer/design`；点击「编辑」→ `/label-designer/design/:id`。 |
| **设计器页** | `LabelDesigner.vue` 管理画布配置、元素列表、选中项、自定义变量名、撤销/复制粘贴。 |
| **触发保存** | 顶部工具栏「保存」按钮 → 触发 `onSave()`，调用 `saveTemplate(payload)`。 |
| **请求**     | `services/api.ts` 内将 `SavePayload` 转成后端约定的 `{ template, options, context }`，POST 到 `BASE/templates/save`。 |
| **认证**     | 请求头自动附带 `Authorization: Bearer <accessToken>`（来自 localStorage）。 |
| **响应**     | 解析 JSON，取 `data.id` 或 `data.data.id` 作为模板 id；失败则根据 HTTP 状态或 `code !== 200` 抛错并提示。 |

---

## 二、功能与数据设计（设计器侧）

### 2.1 设计器状态（单一数据源）

保存前，前端维护这些与「模板」直接相关的状态（均在 `LabelDesigner.vue`）：

| 状态 | 类型 | 说明 |
|------|------|------|
| `templateId` | `string` | 路由参数 `route.params.id`，编辑时有值，新建时为空。 |
| `templateName` | `string` | 模板名称，工具栏可编辑，保存时作为 `template.name`。 |
| `canvasConfig` | `CanvasConfig` | 画布宽高(mm)、DPI、背景色、是否显示网格。 |
| `elements` | `DesignElement[]` | 画布上所有元素（文本、矩形、线条、椭圆、条码、变量等）。 |
| `customVariableNames` | `string[]` | 用户自定义变量名列表（如 `["变量1", "变量2"]`），与「变量」面板一致，随模板保存。 |

保存时**不**把「撤销栈、剪贴板、待放置元素」等 UI 状态发给后端，只发与持久化相关的上述字段。

### 2.2 画布配置（CanvasConfig）

```ts
interface CanvasConfig {
  width: number      // 画布宽度，单位 mm
  height: number     // 画布高度，单位 mm
  dpi: number        // 如 72 / 150 / 300 / 600，影响字号等换算
  backgroundColor: string  // 如 "#ffffff"
  gridEnabled?: boolean    // 是否显示网格（仅前端展示，可不必写入后端）
}
```

保存时会把 `width/height/dpi/backgroundColor` 写入 `template.config.canvas`；`gridEnabled` 仅前端使用，后端可忽略。

### 2.3 元素类型与设计器含义

| type | 设计器含义 | 与打印/变量的关系 |
|------|------------|-------------------|
| `text` | 文本块 | 可设 `dataField` 绑定变量（如 变量1、EPC）；无则用 `content` 固定文本。 |
| `rectangle` | 矩形 | 无变量绑定。 |
| `line` | 直线 | 无变量绑定。 |
| `ellipse` | 椭圆 | 无变量绑定。 |
| `barcode` | 条码 | 可设 `dataField` 绑定变量；无则用 `content` 固定内容。 |
| `variable` | 变量占位 | 必须带 `dataField`（EPC/TID/User Data 或 变量1、变量2 等），打印时由 Excel 或 RFID 填入。 |

所有元素共有的基础字段：`id, type, name, x, y, width, height, rotation, zIndex`（及可选 `visible`）。各类型扩展字段见下文「请求体中的 elements 格式」。

### 2.4 变量与 dataField

- **customVariableNames**：用户在设计器「变量」面板里添加的自定义变量名列表，保存时原样写入 `config.customVariableNames`，加载时用于恢复左侧变量列表。
- **dataField**：单个元素绑定的变量名。  
  - 文本/条码：可选；有则打印时用 Excel 列或 RFID 数据替换，无则用固定 `content`。  
  - 变量元素：必填，表示该占位对应的字段（如 EPC、TID、User Data、变量1、变量2）。

后端只需**按原样存储** `config.customVariableNames` 与各元素的 `dataField`，加载时原样返回即可。

---

## 三、保存接口说明

### 3.1 请求

- **URL**：`{BASE}/templates/save`（当前 `BASE = http://localhost:8080/api`，可按环境配置）。
- **方法**：`POST`。
- **请求头**：
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>`（登录后由前端从 localStorage 读取并附带）。
- **请求体**：见下节「请求体结构」。

### 3.2 请求体结构（完整）

前端在 `api.ts` 的 `saveTemplate` 中组装为如下 JSON（与 `docs/template-api-format.md` 一致）：

```json
{
  "template": {
    "id": "可选，编辑时传模板 id，新建不传或 null",
    "name": "模板名称",
    "description": "RFID标签设计模板",
    "width": 100,
    "height": 60,
    "category": "rfid_label",
    "config": {
      "metadata": { "version": "1.0" },
      "canvas": {
        "width": 100,
        "height": 60,
        "dpi": 300,
        "backgroundColor": "#ffffff",
        "unit": "mm"
      },
      "elements": [
        {
          "id": "el_xxx",
          "type": "text",
          "name": "text",
          "x": 10, "y": 10, "width": 60, "height": 20,
          "rotation": 0, "zIndex": 1,
          "content": "固定文本",
          "fontSize": 12,
          "fontFamily": "Microsoft YaHei",
          "color": "#000000",
          "textAlign": "left",
          "bold": false,
          "italic": false,
          "dataField": "变量1"
        },
        {
          "id": "el_yyy",
          "type": "variable",
          "name": "variable",
          "x": 10, "y": 30, "width": 80, "height": 18,
          "rotation": 0, "zIndex": 1,
          "dataField": "EPC",
          "label": "EPC:",
          "sampleValue": "0123456789ABCDEF"
        },
        {
          "id": "el_zzz",
          "type": "barcode",
          "name": "barcode",
          "x": 10, "y": 50, "width": 80, "height": 40,
          "rotation": 0, "zIndex": 1,
          "content": "123456789012",
          "format": "CODE128",
          "dataField": "条码"
        }
      ],
      "customVariableNames": ["变量1", "变量2"],
      "dataFields": {},
      "printer": { "model": "Zebra ZT410", "density": 8, "speed": 4 }
    }
  },
  "options": { "overwrite": false, "generatePreview": true, "testPrint": false },
  "context": { "userId": "xxx", "clientId": "web_client" }
}
```

说明：

- `template.id`：编辑时传当前模板 id，新建时不传或传 `undefined`（序列化后可能无该字段）。
- `template.name`、`template.width`、`template.height`：来自设计器 `templateName` 与 `canvasConfig`。
- `template.config`：由 `canvasConfig` + `elements`（经 `elementToBackend` 转换）+ `customVariableNames` 等组装而成。
- `options`、`context`：当前为前端写死，后端可按需使用或忽略。

### 3.3 elements 各类型字段一览

前端 `elementToBackend(el)` 按元素类型输出下列字段（未列出的类型可能仅含 base 字段）：

| type | 除 base 外主要字段 |
|------|---------------------|
| **text** | `content`, `fontSize`, `fontFamily`, `color`, `textAlign`, `bold`, `italic`, `dataField`（可选） |
| **rectangle** | `fill`, `stroke`, `strokeWidth`, `cornerRadius` |
| **line** | `stroke`, `strokeWidth` |
| **ellipse** | `fill`, `stroke`, `strokeWidth` |
| **barcode** | `content`, `format`, `dataField`（可选） |
| **variable** | `dataField`, `label`, `sampleValue` |

base 字段（所有元素）：`id`, `type`, `name`, `x`, `y`, `width`, `height`, `rotation`, `zIndex`。

### 3.4 响应与错误处理

- **成功**：HTTP 2xx，且业务 body 中 `code === 200`（或后端无 `code` 仅靠 HTTP 表示成功）。  
  前端从 `data.data.id` 或 `data.id` 取模板 id，用于提示「保存成功」；当前不强制跳转，用户可继续编辑。
- **失败**：
  - HTTP 401/403：前端清除 `accessToken` 等并跳转登录。
  - 其他 4xx/5xx 或 `code !== 200`：抛出错误，提示 `msg` / `message` 或默认文案。

建议后端统一响应格式示例：

```json
{
  "code": 200,
  "msg": "成功",
  "data": {
    "id": "模板 uuid"
  }
}
```

---

## 四、前端保存流程（代码层级）

### 4.1 调用链

1. 用户点击工具栏「保存」 → `Toolbar.vue` 发出 `@save`。
2. `LabelDesigner.vue` 的 `onSave()` 被调用。
3. `onSave()` 内组装 **SavePayload**：
   - `id`: `templateId.value`（编辑时有值，新建为 `undefined`）
   - `name`: `templateName.value`
   - `width` / `height`: `canvasConfig.value.width` / `height`
   - `config`: `canvasConfig.value`（完整 CanvasConfig）
   - `elements`: `elements.value`（当前画布全部 DesignElement）
   - `customVariableNames`: `customVariableNames.value`
4. 调用 `saveTemplate(payload)`（`services/api.ts`）。
5. `saveTemplate` 内：
   - 使用 `payload.elements.map(elementToBackend)` 得到 `config.elements`。
   - 拼出 `{ template, options, context }`，`JSON.stringify` 后 POST。
   - 解析响应，返回 `{ id }`；失败则 `parseResponse` 内部抛错。

### 4.2 SavePayload 与 elementToBackend

- **SavePayload**（前端传给 `saveTemplate` 的形参）：
  - `id?`, `name`, `width`, `height`, `config: CanvasConfig`, `elements: DesignElement[]`, `customVariableNames?`
- **elementToBackend**：将设计器内的 `DesignElement` 转成后端 `config.elements[]` 的一项（仅包含后端需要持久化的字段，如上面「elements 各类型字段一览」）。

这样设计器与后端之间只通过「设计器状态 → SavePayload → 后端 body」这一条线对接，便于维护和联调。

---

## 五、与「加载模板」的对应关系

- **保存**：设计器状态 → `SavePayload` → `elementToBackend` → `template.config.elements` + `customVariableNames` 等 → POST body。
- **加载**：GET `/templates/:id` → 后端返回 `data.config`（含 `config.elements`、`config.customVariableNames`）→ 前端 `backendElementToDesign` 将每项转回 `DesignElement`，写回 `elements`、`customVariableNames`。

因此后端只需保证「保存时写入的 `config` 结构」与「加载时返回的 `config` 结构」一致（含 `customVariableNames` 与各元素 `dataField`），前端即可正确还原设计器状态。更细的加载格式与字段说明见 `docs/template-api-format.md`。

---

## 六、小结表

| 项目 | 内容 |
|------|------|
| 入口路由 | 新建：`/label-designer/design`；编辑：`/label-designer/design/:id` |
| 保存触发 | 工具栏「保存」→ `onSave()` → `saveTemplate(payload)` |
| 请求 | POST `{BASE}/templates/save`，Body 为 `{ template, options, context }`，Header 带 Bearer Token |
| 请求体核心 | `template.config`：`canvas` + `elements`（经 elementToBackend）+ `customVariableNames` + `metadata`、`dataFields`、`printer` 等 |
| 响应 | 成功取 `data.id`（或 `data.data.id`）；失败 401/403 跳登录，其余提示错误信息 |
| 后端需持久化 | `template` 整表/文档，且 `config` 至少包含：`canvas`、`elements`、`customVariableNames`，各元素含类型相关字段及可选 `dataField` |

如需接口字段的逐项说明或与 ZPL/打印的衔接，可同时参考 `docs/template-api-format.md` 与 `docs/zpl-command-reference.md`。

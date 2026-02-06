# 模板接口数据格式说明（后端对接）

本文档说明标签模板**保存 / 加载**时与后端交互的数据格式。若后端尚未支持以下字段，可按需扩展。

---

## 1. 保存模板（POST 请求体）

前端当前发送的 `template.config` 结构如下（在原有基础上**新增** `customVariableNames`，元素**新增** `dataField` 等）：

```json
{
  "template": {
    "id": "可选，编辑时传",
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
          "x": 10, "y": 30, "width": 80, "height": 18,
          "rotation": 0, "zIndex": 1,
          "dataField": "EPC",
          "label": "EPC:",
          "sampleValue": "0123456789ABCDEF"
        },
        {
          "id": "el_zzz",
          "type": "barcode",
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

### 新增/变更字段说明

| 位置 | 字段 | 类型 | 说明 |
|------|------|------|------|
| `config` | **customVariableNames** | `string[]` | **新增**。用户自定义变量名列表，如 `["变量1", "变量2"]`，随模板保存。 |
| `elements[].type === 'text'` | **dataField** | `string` 可选 | **新增**。绑定变量名（如 `变量1`、`EPC`）。为空或不传表示不绑定，使用固定 `content`。 |
| `elements[].type === 'barcode'` | **dataField** | `string` 可选 | **新增**。绑定变量名，打印时用 Excel 列替换条码内容。 |
| `elements[].type === 'variable'` | **dataField** | `string` | **原为** `"EPC" \| "TID" \| "User Data"`，**现为任意字符串**，如 `变量1`、`变量2`、`EPC`、`TID`、`User Data`。 |

后端只需**按原样存储** `config`（含 `customVariableNames` 与各元素的 `dataField`），并在加载时原样返回即可。

---

## 2. 加载模板（GET 响应）

前端期望从接口拿到结构如下（与现有格式兼容，仅补充字段）：

- 模板根或 `data.config` 中需包含：
  - `config.elements`：元素数组，每项可含上述 `dataField`。
  - **config.customVariableNames**：`string[]`，用户变量名列表，如 `["变量1", "变量2"]`。若后端暂无该字段，前端会退化为 `[]`，并从元素中的 `dataField` 推断用户变量（变量类型且非 EPC/TID/User Data 的会合并到列表）。

即：**保存时**把 `customVariableNames` 和每个元素的 `dataField` 写入你现有的模板存储（如 JSON 或 DB 的 config 字段）；**加载时**在 `config` 里返回同样结构。若后端暂时不存 `customVariableNames`，只存元素的 `dataField`，前端也能工作，只是左侧「变量」列表会在加载时从元素中推断出来。

---

## 3. 是否需要改后端？

- **仅做“原样存、原样取”**：在现有模板的 `config` 中增加：
  - 顶层或与 `canvas`、`elements` 同级：**customVariableNames**（数组）。
  - 文本/条码/变量元素上：**dataField**（字符串，可选或必选按类型）。
- **不打算支持用户变量**：可以不存 `customVariableNames`，前端会从元素 `dataField` 推断；但若元素里已有 `变量1`、`变量2` 等，建议一并存，以便下次编辑时左侧列表一致。

总结：**需要后端在模板 config 中支持并持久化 `customVariableNames` 与各元素的 `dataField`**；请求/响应体其余部分可与现有接口保持一致，按上表扩展即可。

---

## 4. RFID 变量（EPC / TID / User Data）与 ZPL

- **EPC、TID、User Data** 视为「由打印机从 RFID 标签读取」的变量，**不从 Excel 绑定**。
- 前端生成 ZPL 时，对绑定为 EPC/TID/User Data 的元素会输出：
  - 格式开头：`^RS8` 及针对各类型的 `^RFR,<内存码>,0,<长度>,1^FNn^FS`（E=EPC→^FN1，H=TID→^FN2，U=User→^FN3）。
  - 文本/变量元素：`^FO x,y ^A0N,...^FNn^FS`（用 ^FN 引用读取结果）。
  - 条码元素：`^FO x,y ^BY...^BCN^FD^FNn^FS`（条码内容来自 ^FN）。
- 连接打印页的「列绑定」中**不展示** EPC、TID、User Data，仅展示可绑定 Excel 的变量（如 变量1、变量2、条码等）。

# 模板接口数据格式说明（后端对接）

本文档说明标签模板**保存 / 加载**时与后端交互的数据格式。若后端尚未支持以下字段，可按需扩展。

---

## 1. 保存模板（POST 请求体）

前端当前发送的请求体结构如下：**width、height、dpi、orientation 仅出现在 template 下**，`config.canvas` 中不再重复 width/height/dpi，仅保留 backgroundColor、unit。

```json
{
  "template": {
    "id": "可选，编辑时传",
    "name": "模板名称",
    "description": "RFID标签设计模板",
    "width": 100,
    "height": 60,
    "dpi": 300,
    "orientation": "portrait",
    "category": "rfid_label",
    "config": {
      "metadata": { "version": "1.0" },
      "canvas": {
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

### 字段说明（含与后端对齐的布局字段）

| 位置 | 字段 | 类型 | 说明 |
|------|------|------|------|
| `template` | **width** | `number` | 画布宽度（mm），与后端一致，仅在此处保存。 |
| `template` | **height** | `number` | 画布高度（mm），仅在此处保存。 |
| `template` | **dpi** | `number` | 分辨率（如 300），仅在此处保存。 |
| `template` | **orientation** | `string` | 打印方向：`"portrait"`（纵向）或 `"landscape"`（横向），与后端 `orientation` 一致，默认 `"portrait"`。 |
| `config.canvas` | — | — | **不再包含** width、height、dpi，仅保留 `backgroundColor`、`unit`，避免与 template 重复。 |
| `config` | **customVariableNames** | `string[]` | 用户自定义变量名列表，如 `["变量1", "变量2"]`，随模板保存。 |
| `elements[].type === 'text'` | **dataField** | `string` 可选 | **新增**。绑定变量名（如 `变量1`、`EPC`）。为空或不传表示不绑定，使用固定 `content`。 |
| `elements[].type === 'barcode'` | **dataField** | `string` 可选 | **新增**。绑定变量名，打印时用 Excel 列替换条码内容。 |
| `elements[].type === 'variable'` | **dataField** | `string` | **原为** `"EPC" \| "TID" \| "User Data"`，**现为任意字符串**，如 `变量1`、`变量2`、`EPC`、`TID`、`User Data`。 |

后端只需**按原样存储** `config`（含 `customVariableNames` 与各元素的 `dataField`），并在加载时原样返回即可。

---

## 2. 加载模板（GET 响应）

前端期望从接口拿到结构如下（与保存结构对应）：

- **模板根（data）**：建议返回 `id`、`name`、`width`、`height`、`dpi`、`orientation`（与保存时一致）。前端会优先从 `data` 根级读取这些字段，若不存在则从 `config.canvas` 回退。
- **data.config** 中需包含：
  - `config.canvas`：至少含 `backgroundColor`、`unit`；若后端仍返回 `width`/`height`/`dpi`，前端会用作回退。
  - `config.elements`：元素数组，每项可含上述 `dataField`。
  - **config.customVariableNames**：`string[]`，用户变量名列表。若后端暂无该字段，前端会退化为 `[]`，并从元素中的 `dataField` 推断用户变量。

即：**保存时**把 template 级的 width、height、dpi、orientation 与 config（含 canvas、customVariableNames、elements）写入存储；**加载时**在 data 根级返回 width、height、dpi、orientation，在 config 里返回 canvas、elements、customVariableNames。

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

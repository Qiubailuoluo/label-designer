# 3. 模板设置模块：架构、请求响应与文件结构

## 3.1 模块职责

- **模板列表**：展示用户模板，支持新建、编辑、删除。  
- **标签设计器**：画布上拖拽/点击放置元素（文本、矩形、线、椭圆、条码、图片、变量），配置属性与变量绑定，保存/加载与后端一致的数据格式。

## 3.2 文件架构

```
src/views/label-designer/
├── LabelDesigner.vue       # 设计器页面（布局 + 状态中枢）
├── TemplateList.vue        # 模板列表页
├── types.ts                # 元素类型、CanvasConfig、DesignElement 等
├── services/
│   └── api.ts              # 模板相关 HTTP：列表、加载、保存、删除
├── utils/
│   └── fabric-canvas.ts    # Fabric 画布封装（渲染、选中、拖拽、缩放）
├── components/
│   ├── Toolbar.vue         # 顶部：模板名、尺寸/DPI、保存/返回
│   ├── LeftPanel.vue       # 左侧：基本元素 / RFID 变量 / 自定义变量
│   ├── DesignCanvas.vue    # 中间：Fabric 画布
│   └── PropertiesPanel.vue  # 右侧：当前选中元素的属性
└── css/                    # 各组件与页面样式
    ├── label-designer.css
    ├── list.css
    ├── toolbar.css
    ├── left-panel.css
    ├── properties-panel.css
    └── design-canvas.css
```

- **数据流**：`LabelDesigner.vue` 持有 `canvasConfig`、`elements`、`customVariableNames`、`selectedId` 等；子组件通过 props + emit 与父组件同步；保存/加载走 `services/api.ts`。  
- **类型**：所有元素形态（text/rectangle/line/ellipse/barcode/image/variable）在 `types.ts` 中定义，与后端 `config.elements` 一一对应；API 层在 `api.ts` 中做「设计器元素 ↔ 后端元素」的转换。

## 3.3 后端接口与请求/响应格式

接口基址：与全局 API 一致，为 `http://localhost:8080/api`；请求头由 `api/index.ts` 或 `services/api.ts` 中的 `authHeaders()` 自动带 Token。

### 3.3.1 获取模板列表

- **请求**：`GET /api/templates`  
- **响应**：  
  - 期望结构：`{ data: { list: [ { template_id/id, template_name/name, create_time/updatedAt/createdAt } ] } }` 或直接 `{ list: [...] }`。  
  - 前端会取 `data?.list ?? data`，并映射为 `{ id, name, updatedAt, createdAt }`（见 `getTemplateList()`）。

### 3.3.2 加载单个模板

- **请求**：`GET /api/templates/:id`  
- **响应**：  
  - 期望根或 `data` 中包含：`id, name, width, height, config`。  
  - `config` 须包含：  
    - `config.canvas`：width, height, dpi, backgroundColor 等。  
    - `config.elements`：元素数组，每项含 type、位置尺寸、以及类型相关字段（如 text 的 content、dataField；variable 的 dataField、label、sampleValue 等）。  
    - **config.customVariableNames**：`string[]`，用户自定义变量名列表（如 `["变量1","变量2"]`）。  
  - 若后端暂无 `customVariableNames`，前端会从元素的 `dataField` 推断用户变量；但建议后端一并持久化，以保证编辑时左侧变量列表一致。  
  - 详见 [template-api-format.md](./template-api-format.md)。

### 3.3.3 保存模板

- **请求**：`POST /api/templates/save`  
- **请求体**：前端在 `api.ts` 的 `saveTemplate()` 中组装的 body，结构大致为：
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
        "canvas": { "width", "height", "dpi", "backgroundColor", "unit": "mm" },
        "elements": [ /* 每项含 id, type, x, y, width, height, rotation, zIndex, 及类型字段、dataField 等 */ ],
        "customVariableNames": ["变量1", "变量2"],
        "dataFields": {},
        "printer": { "model": "Zebra ZT410", "density": 8, "speed": 4 }
      }
    },
    "options": { "overwrite": false, "generatePreview": true, "testPrint": false },
    "context": { "userId", "clientId": "web_client" }
  }
  ```
- **响应**：需包含保存后的模板 `id`（如 `data.id` 或根级 `id`），前端用于后续编辑或提示。  
- 元素中与「变量」相关的约定：  
  - 文本/条码可有 **dataField**（绑定变量名）；变量元素必有 **dataField**（EPC/TID/User Data 或 变量1、变量2）。  
  - 详见 [template-api-format.md](./template-api-format.md)。

### 3.3.4 删除模板

- **请求**：`DELETE /api/templates/:id`  
- **响应**：前端仅判断 2xx 成功，无特定 body 要求。

## 3.4 设计器与后端的数据映射

- **元素 ↔ 后端**：`api.ts` 中 `elementToBackend()` 将 `DesignElement` 转为后端一条 element；`backendElementToDesign()` 将后端一条转为 `DesignElement`。  
- **画布**：`config` 中的 width、height、dpi、backgroundColor 与后端 `config.canvas` 对应。  
- **自定义变量**：`customVariableNames` 与 `config.customVariableNames` 一一对应，保存时写入、加载时读回；左侧「变量」列表据此展示，并可添加新变量名。

## 3.5 小结

- **架构**：单页「列表 + 设计器」，设计器内为 Toolbar + LeftPanel + DesignCanvas + PropertiesPanel，状态在 `LabelDesigner.vue`，类型在 `types.ts`，请求在 `services/api.ts`。  
- **请求/响应**：列表 GET、加载 GET、保存 POST、删除 DELETE；数据格式以 [template-api-format.md](./template-api-format.md) 与本节为准，后端按「原样存、原样取」扩展 `customVariableNames` 与各元素 `dataField` 即可。

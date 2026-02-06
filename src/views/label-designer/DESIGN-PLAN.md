# 标签设计器 - 详细设计方案

## 一、功能概述

标签设计器在 **右侧活动区域** 展示（与仪表盘、模板设置等页面一致的 MainLayout 主内容区），参考 ZDesigner 类界面，实现：

- **顶部**：菜单栏（文件 / 主页 / 数据 / 视图 / 帮助）及工具栏（剪贴板、字体、动作、对齐、对象等）
- **左侧**：布局板（文本、文本框、条码、图片、矩形、直线、椭圆、反白等）+ 变量面板（RFID 标记：EPC、TID、User Data）
- **中间**：带标尺的设计画布
- **右侧**：属性面板（选中元素时编辑位置、样式、数据源绑定等）
- **底部**：状态栏（RFID 写入状态、缩放、全屏等）

当前实现：**标签设计**功能统一在 `views/label-designer/` 下，包含模板列表与设计器；路由为 `/label-designer`（列表）、`/label-designer/design/:id?`（设计器，可选 id 编辑）。

---

## 二、前端页面结构（按功能合并后）

```
views/label-designer/              # 标签设计模块（列表 + 设计器）
├── TemplateList.vue               # 模板列表页（创建/编辑/删除入口）
├── LabelDesigner.vue              # 设计器页，右侧活动区全高展示
├── components/
│   ├── Toolbar.vue                # 顶部工具栏
│   ├── LeftPanel.vue              # 左侧布局板 + 变量
│   ├── DesignCanvas.vue           # 中央画布（Fabric.js）
│   └── PropertiesPanel.vue        # 右侧属性
├── services/
│   └── api.ts                     # 列表/加载/保存/删除
├── types.ts
├── utils/
│   └── fabric-canvas.ts
├── css/
│   ├── list.css                   # 列表页样式
│   └── label-designer.css         # 设计器页样式
└── DESIGN-PLAN.md
```

与参考页面对应的区域划分：

| 参考区域     | 实现位置 / 说明 |
|-------------|------------------|
| 顶部菜单栏   | components/Toolbar.vue |
| 左侧布局板   | LeftPanel.vue（文本、矩形、直线、椭圆、条码、图片） |
| 左侧变量     | LeftPanel.vue 变量区（EPC、TID、User Data） |
| 中央画布     | DesignCanvas.vue（Fabric.js） |
| 右侧属性     | PropertiesPanel.vue（未选时「未选定项目」） |

---

## 三、数据模型（与后端一致）

### 3.1 模板根结构

```ts
interface LabelTemplate {
  id?: string
  name: string
  description?: string
  width: number          // 画布宽，单位 mm
  height: number         // 画布高，单位 mm
  category?: string      // 如 'rfid_label'
  config: TemplateConfig
  createTime?: string
  updateTime?: string
}
```

### 3.2 画布与元素配置（config）

```ts
interface TemplateConfig {
  metadata?: { version: string; description?: string }
  canvas: {
    width: number
    height: number
    dpi: number
    backgroundColor: string
    unit: 'mm'
  }
  elements: TemplateElementDto[]   // 见下
  dataFields?: Record<string, string>  // 变量/数据源映射，用于 EPC、TID、User Data
  printer?: { model?: string; density?: number; speed?: number }
}
```

### 3.3 元素（与保存接口一致）

基础字段（所有元素）：

- `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `zIndex`

按类型的扩展字段示例：

- **text**：`content`, `fontSize`, `fontFamily`, `fontWeight`, `color`, `textAlign`
- **barcode**：`format`, `data`（或绑定变量名）, `humanReadable`, `textBelow`, `moduleWidth`
- **qrCode**：`content`
- **image**：`src`, `alt`
- **rectangle / circle**：`fillColor`, `strokeColor`, `strokeWidth`
- **变量绑定**：若元素显示 RFID 数据，可增加 `dataField: 'EPC' | 'TID' | 'User Data'` 或与 `dataFields` 的 key 对应

后端存储建议：以 **JSON** 形式存 `config`（含 `canvas`、`elements`、`dataFields` 等），便于版本扩展和解析。

---

## 四、保存到后端的流程

### 4.1 触发时机

- 用户点击工具栏「存储」/「保存」
- 可选：自动保存（定时或防抖，按产品需求）

### 4.2 前端组装 payload

1. 从画布与当前状态收集：
   - 画布：宽、高、DPI、背景色
   - 元素列表：类型、位置、尺寸、旋转、层级 + 各类型特有字段（文本内容、条码格式、数据源变量等）
2. 若支持变量/RFID 绑定，把「变量名 → 数据源」写入 `config.dataFields`，元素上写 `dataField` 引用。
3. 组装为后端约定的 **嵌套结构**（与现有 `api.ts` 一致），例如：

```json
{
  "template": {
    "id": "可选，更新时传",
    "name": "模板名称",
    "description": "RFID标签设计模板",
    "width": 100,
    "height": 60,
    "category": "rfid_label",
    "config": {
      "metadata": { "version": "1.0" },
      "canvas": { "width": 100, "height": 60, "dpi": 300, "backgroundColor": "#ffffff", "unit": "mm" },
      "elements": [ /* 见上 3.3 */ ],
      "dataFields": {},
      "printer": {}
    }
  },
  "options": { "overwrite": false, "generatePreview": true },
  "context": { "userId": "当前用户", "clientId": "web_client" }
}
```

### 4.3 请求与错误处理

- **POST** `/api/templates/save`，Body 为上述 JSON，Header 带 `Authorization: Bearer <token>`。
- 成功：返回模板 id 及必要信息，前端可提示「保存成功」并可选跳转（如返回模板列表或留在设计器）。
- 失败：根据 HTTP 状态码/业务 code 提示（如 401 重新登录、4xx 提示错误信息）。

---

## 五、接口设计

### 5.1 基础约定

- **Base URL**：`/api`（或项目统一前缀）
- **认证**：需登录的接口在 Header 中携带 `Authorization: Bearer <accessToken>`
- **Content-Type**：`application/json`

### 5.2 模板相关

| 方法 | 路径 | 说明 | 请求体 / 参数 |
|------|------|------|----------------|
| GET  | `/templates` | 获取模板列表（分页可选） | Query: `page`, `pageSize` 等 |
| GET  | `/templates/:id` | 获取单个模板详情（用于编辑加载） | 路径参数 `id` |
| POST | `/templates/save` | 新建或更新模板 | Body: 上文的 `{ template, options, context }` |
| DELETE | `/templates/:id` | 删除模板 | 路径参数 `id` |

### 5.3 响应格式建议（统一）

**列表 GET /templates**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "template_id": "uuid",
        "template_name": "名称",
        "create_time": "2025-02-06T12:00:00Z",
        "update_time": "2025-02-06T12:00:00Z"
      }
    ],
    "total": 100
  }
}
```

**详情 GET /templates/:id**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "模板名称",
    "description": "说明",
    "width": 100,
    "height": 60,
    "category": "rfid_label",
    "config": {
      "canvas": { ... },
      "elements": [ ... ],
      "dataFields": { ... }
    }
  }
}
```

**保存 POST /templates/save**

请求：见 4.2。  
响应：

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "message": "保存成功"
  }
}
```

### 5.4 与 RFID / 变量相关的扩展接口（可选）

若后端需要单独管理「变量」或 RFID 数据源，可增加：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/templates/variables` 或 `/rfid/fields` | 获取可用变量列表（如 EPC、TID、User Data） |
| POST | `/templates/:id/test-print` | 测试打印（若由后端生成打印数据） |
| GET/POST | `/rfid/write` 等 | RFID 写入相关（按实际设备/协议再定） |

这些可在实现「变量面板」和「测试打印」「RFID 写入」时再对接。

---

## 六、前端与后端联调要点

1. **保存结构**：前端已按 `api.ts` 中 `saveTemplate` 的嵌套结构组装，后端需按同一结构解析并落库（建议 `config` 整段存 JSON）。
2. **加载模板**：GET `/templates/:id` 返回的 `data.config.elements` 需与前端 `LabelDesigner` 的加载逻辑及 `services/api.ts` 中 `backendElementToDesign` 映射一致（如 `title` → `text`、字段名 `data`/`content` 等）。
3. **列表字段**：列表接口返回的 `template_id`、`template_name`、`create_time` 等与 `TemplateList.vue` 使用的 `getTemplateList` 映射保持一致。
4. **认证**：所有上述接口在未登录时返回 401/403，前端统一清除 token 并跳转登录。

---

## 七、后续可做功能（对应参考页面）

- **变量面板**：左侧增加「变量」+「RFID 标记」树，支持将 EPC、TID、User Data 拖到画布绑定到文本/条码元素。
- **文档属性**：弹窗或侧栏配置模板名称、尺寸、打印机等，并写回 `config` 与保存接口。
- **测试打印**：调用后端「测试打印」接口或本地打印预览。
- **RFID 写入**：状态栏显示「RFID 写入已启用」，与后端/设备接口对接。
- **更多元素**：直线、椭圆、反白等，在 `ElementType` 与 `config.elements` 中扩展类型与 DTO。

以上为标签设计器的详细方案，包含在右侧活动区的展示方式、数据模型、保存流程及接口设计，可直接作为前后端对接与实现的依据。

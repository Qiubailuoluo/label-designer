# 标签设计器模块

本模块提供可视化 RFID 标签模板设计能力：画布配置、元素增删改、图层管理、属性面板，并与后端模板 API 对接保存/加载。

## 目录结构

```
label-designer/
├── README.md              # 本说明
├── DESIGN-PLAN.md         # 设计规划文档
├── LabelDesigner.vue      # 设计器主页面（画布 + 左侧面板 + 右侧属性）
├── TemplateList.vue       # 模板列表页（创建/编辑/删除入口）
├── types.ts               # 元素与画布类型定义（单一数据源）
├── components/            # 设计器子组件
│   ├── DesignCanvas.vue   # Fabric 画布（拖拽、缩放、选中、与 state 双向同步）
│   ├── LeftPanel.vue      # 左侧：图层列表、元素工具、RFID/用户变量
│   ├── PropertiesPanel.vue# 右侧：当前选中元素的属性编辑
│   └── Toolbar.vue        # 顶部：返回、模板名、画布尺寸/DPI、保存
├── css/                   # 模块样式
├── services/
│   └── api.ts             # 模板保存/加载/列表/删除（对接 /api/templates）
└── utils/
    └── fabric-canvas.ts   # mm↔px、DesignElement↔Fabric 对象、条码/图片异步加载
```

## 数据流

- **单一数据源**：`LabelDesigner.vue` 中的 `elements`（`DesignElement[]`）和 `canvasConfig`（`CanvasConfig`）。
- **画布同步**：`DesignCanvas` 通过 watch 与 props 同步；结构变化（增删、画布尺寸）时先 `flushCanvasToState()` 再重画；内容/几何来自属性面板时直接按 state 重画。
- **事件**：左侧面板 `add-element`、`element-update`、`select`；画布 `select`、`element-update`、`canvas-click`（放置新元素）；右侧面板 `update`、`delete`。

## 元素类型

| 类型       | 说明 |
|------------|------|
| text       | 文本，可绑定变量（打印时 Excel 列替换） |
| rectangle  | 矩形（填充、边框、圆角） |
| line       | 直线（width 为长度，rotation 为角度） |
| ellipse    | 椭圆 |
| barcode    | 条码/二维码（CODE128、QR 等），可绑定变量 |
| image      | 图片（上传后 base64 存 src） |
| variable   | 变量占位（RFID：EPC/TID/User Data；或用户变量） |

## 依赖

- **fabric**：画布渲染与交互。
- **qrcode** / **jsbarcode**：二维码与条码生成（画布预览）。
- 后端接口：见 `services/api.ts`（需登录 Token）。

## 相关文档

- 架构与接口：`docs/` 下 `01-architecture-and-tech-stack.md`、`03-template-module-design.md`、`template-api-format.md`。

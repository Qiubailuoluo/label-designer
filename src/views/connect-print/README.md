# 连接打印模块

本模块用于选择打印机、选择标签模板、绑定 Excel 列与变量、预览 ZPL、单张/批量打印。支持 USB 与 TCP 连接，通过浏览器扩展与本地打印服务与打印机通信。

## 目录结构

```
connect-print/
├── README.md           # 本说明
├── ConnectPrint.vue     # 主页面：打印机列表、连接配置、模板选择、Excel 导入、列绑定、预览与打印
├── css/
│   └── connect-print.css
└── utils/
    ├── print-bridge.ts  # 与打印扩展的 postMessage 通信（获取打印机、添加连接、发送原始数据）
    └── zpl-generator.ts # 根据设计器模板生成 ZPL（^XA...^XZ）、变量占位符、RFID 指令
```

## 功能概览

1. **本地打印机**：左侧列表来自扩展（扩展从本地打印服务拉取）；支持搜索、选择；未检测到扩展时提示安装并运行本地打印服务。
2. **连接方式**：USB（端口/厂商）或 TCP（IP、端口、超时）；「应用连接」后新打印机会加入列表。
3. **模板**：从模板 API 拉取列表，选择后解析出可填变量（含 EPC/TID/User Data 与用户变量、条码绑定变量）。
4. **批量变量**：导入 Excel，表头与变量做列绑定；EPC/TID/User Data 由打印机 RFID 读取，不参与绑定。
5. **ZPL 预览与打印**：根据模板与当前绑定生成 ZPL；单张打印（可填变量用占位符或 Excel 第一行）；批量打印多张，每张替换占位符后通过扩展发送到选中打印机。

## 依赖

- **标签设计器类型**：`@/views/label-designer/types`（DesignElement、CanvasConfig）。
- **打印扩展**：见项目根目录 `print-extension/`；扩展与 `print-extension/local-print-service` 需同时就绪方可获取打印机并发送数据。
- **xlsx**：解析 Excel 表头与行数据。

## 相关文档

- `docs/04-connect-print-module.md`、`docs/zpl-command-reference.md`
- `print-extension/README.md`、`print-extension/用户打印使用说明.md`

# 连接打印扩展交接说明

本文档面向扩展/插件开发，说明前端与「连接打印扩展」的通信契约、本地打印服务接口及实现要点，便于在根目录 `print-extension/` 中实现并后续维护。

---

## 1. 使用场景

- 前端（标签设计系统）部署在**云服务器**，用户通过浏览器访问。
- 打印机在用户**本地**（USB 或内网 TCP）。
- 需要在本机运行「打印扩展 + 本地打印服务」：扩展负责页面与本地服务桥接，本地服务负责与打印机通信（TCP 发 ZPL、USB 需系统/驱动支持）。

---

## 2. 前端与扩展的通信契约（postMessage）

### 2.1 约定

- 页面只与**扩展的 Content Script** 通过 `window.postMessage` 通信。
- 页面发出的消息带 `source: 'connect-print-page'`，扩展回复带 `source: 'connect-print-extension'`，便于过滤。
- 每条请求带唯一 `requestId`，回复时原样带回，用于匹配异步响应。

### 2.2 页面 → 扩展（请求）

所有请求格式：

```ts
{
  source: 'connect-print-page',
  type: string,      // 见下表
  requestId: string,
  payload?: object  // 部分类型需要
}
```

| type | 说明 | payload |
|------|------|---------|
| `PING` | 检测扩展是否可用 | 无 |
| `GET_PRINTERS` | 获取打印机列表 | 无 |
| `ADD_CONNECTION` | 添加连接（USB/TCP）为打印机 | `{ connectionType: 'usb' \| 'tcp', config: { usb: { port, vendor }, tcp: { host, port, timeout } } }` |
| `PRINT_ZPL` | 发送单条 ZPL | `{ printerId: string, zpl: string }` |
| `PRINT_ZPL_BATCH` | 批量发送 ZPL | `{ printerId: string, zplList: string[] }` |

### 2.3 扩展 → 页面（响应）

响应格式（发往 `window`，页面监听 `message`）：

```ts
{
  source: 'connect-print-extension',
  requestId: string,  // 与请求一致
  success: boolean,
  data?: any,         // 成功时：PING→true，GET_PRINTERS→PrinterItem[]，ADD_CONNECTION→PrinterItem，其余可无
  error?: string      // 失败时的提示
}
```

`PrinterItem` 形状：

```ts
{ id: string, name: string, address?: string }
```

- **PING**：扩展收到后直接回复 `success: true, data: true` 即可（无需请求本地服务也可）。
- **GET_PRINTERS**：扩展请求本地打印服务 `GET /printers`，将返回的列表原样作为 `data`。
- **ADD_CONNECTION**：扩展请求本地打印服务 `POST /connection`，将返回的打印机对象作为 `data`。
- **PRINT_ZPL**：扩展请求本地打印服务 `POST /print`，成功则 `success: true`。
- **PRINT_ZPL_BATCH**：扩展请求本地打印服务 `POST /print/batch`，成功则 `success: true`。

---

## 3. 本地打印服务接口（供扩展调用）

建议扩展通过 `fetch` 请求本机固定端口（如 `http://127.0.0.1:8765`），仅扩展/本地环境可访问，避免云前端直连。

### 3.1 基础

- 基址：`http://127.0.0.1:8765`（可配置）
- 请求头：`Content-Type: application/json`（POST 时）

### 3.2 GET /printers

- 返回已发现的打印机及已添加的连接（USB/TCP）。
- 响应 JSON：`{ list: PrinterItem[] }` 或直接 `PrinterItem[]`。

### 3.3 POST /connection

- 添加一个连接为打印机（显示在列表中，供后续打印使用）。
- 请求体：`{ connectionType: 'usb'|'tcp', config: { usb: { port, vendor }, tcp: { host, port, timeout } } }`
- 响应 JSON：`PrinterItem`（含生成的 `id`、`name`、`address` 等）。

### 3.4 POST /print

- 向指定打印机发送一条 ZPL。
- 请求体：`{ printerId: string, zpl: string }`
- 响应：200 成功，非 200 或 JSON `{ error: string }` 表示失败。

### 3.5 POST /print/batch

- 向指定打印机按顺序发送多条 ZPL。
- 请求体：`{ printerId: string, zplList: string[] }`
- 响应：200 成功，非 200 或 JSON `{ error: string }` 表示失败。

---

## 4. 前端代码位置（供对接与排错）

| 功能 | 文件 | 说明 |
|------|------|------|
| 契约常量与桥接 API | `src/views/connect-print/utils/print-bridge.ts` | `BRIDGE_SOURCE_PAGE`、`BRIDGE_SOURCE_EXTENSION`，以及 `getPrinters`、`addConnection`、`printZPL`、`printZPLBatch`、`isExtensionAvailable` |
| 连接打印页 | `src/views/connect-print/ConnectPrint.vue` | 调用 print-bridge，刷新列表、应用连接、打印当前行、批量打印 |

扩展只需按上述契约在 Content Script 中监听 `connect-print-page` 消息、调用本地服务并回传 `connect-print-extension` 消息即可，无需修改前端业务逻辑。

---

## 5. 扩展与本地服务实现建议

- **扩展**（如 Chrome Extension）：
  - Content Script 注入到前端页面所在域名（或配置 match 为前端云域名），监听 `window.message`，过滤 `source === 'connect-print-page'`，根据 `type` 用 `fetch` 调本地服务，再将结果用 `source: 'connect-print-extension'` 回传。
  - 可选：Background 中调本地服务，Content Script 与 Background 通过 `chrome.runtime.sendMessage` 转发，避免在页面环境直连 localhost 时的限制（视具体浏览器而定）。
- **本地打印服务**（如 Node.js）：
  - 维护内存或配置中的「打印机列表」（系统打印机 + 用户通过 POST /connection 添加的 TCP/USB）。
  - TCP 打印机：用 socket 连接 `host:port`，写入 ZPL 字节流后关闭。
  - USB：需根据操作系统使用相应驱动或库（如 node-usb、serialport 等），本仓库示例可先实现 TCP，USB 留接口或占位。

---

## 6. 根目录 print-extension 结构说明

```
print-extension/
├── extension/           # 浏览器扩展
│   ├── manifest.json
│   ├── content.js       # 监听页面 postMessage，转发到 background 或直连本地服务
│   └── background.js    # 可选：请求本地服务并回传
├── local-print-service/ # 本地打印服务（Node.js）
│   ├── package.json
│   ├── server.js       # Express：/printers, /connection, /print, /print/batch
│   └── README.md
└── README.md            # 使用与构建说明
```

详见 `print-extension/README.md` 及各子目录内说明。

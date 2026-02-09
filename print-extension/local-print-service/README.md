# 本地打印服务

为「连接打印扩展」提供本机 HTTP 接口：打印机列表、添加连接、发送 ZPL。

## 安装与运行

```bash
npm install
node server.js
```

默认监听 `http://127.0.0.1:8765`。可通过环境变量 `PRINT_SERVICE_PORT` 修改端口。

## 接口

- `GET /printers`：返回 `{ list: [{ id, name, address }] }`
- `POST /connection`：body `{ connectionType: 'usb'|'tcp', config }`，返回 `{ id, name, address }`
- `POST /print`：body `{ printerId, zpl }`
- `POST /print/batch`：body `{ printerId, zplList }`

TCP 打印机：按配置的 host:port 建立 socket 并写入 ZPL。USB 当前返回 501，可后续接入 serialport 等。

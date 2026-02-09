# 连接打印扩展

云部署标签设计系统时，通过本扩展与本地打印服务连接，实现将 ZPL 发送到用户本机打印机（TCP/USB）。

## 结构

- **extension/**：Chrome 扩展（Manifest V3），负责页面与本地打印服务的桥接。
- **local-print-service/**：Node.js 本地服务，提供打印机列表、添加连接、发送 ZPL 等接口。

## 使用步骤

1. **启动本地打印服务**（用户本机）
   ```bash
   cd local-print-service
   npm install
   node server.js
   ```
   默认监听 `http://127.0.0.1:8765`。

2. **安装扩展**（Chrome）
   - 打开 `chrome://extensions/`
   - 开启「开发者模式」
   - 「加载已解压的扩展程序」选择本目录下的 `extension` 文件夹。

3. **配置扩展可访问的页面**
   - 在 `extension/manifest.json` 的 `content_scripts.matches` 中配置你的前端页面域名，例如 `https://your-app.example.com/*`。

4. 在标签设计系统「连接打印」页：应用连接、刷新打印机列表、打印当前行 / 批量打印即可。

## 通信与接口

详见项目根目录 `docs/connect-print-extension-handover.md`。

# 连接打印扩展

云部署标签设计系统时，通过本扩展与本地打印服务连接，实现将 ZPL 发送到用户本机打印机（TCP/USB）。

---

## 一、先跑通本地测试（不启动 Node 服务）

当前扩展默认请求 **本地前端**（`http://localhost:5173/api/print`），用 Vite 提供的模拟接口，无需启动 `local-print-service` 即可把「连接打印」整条链路跑通。

### 1. 启动前端

在项目根目录执行：

```bash
npm run dev
```

浏览器访问 **http://localhost:5173**，并登录进入系统。

### 2. 安装并启用扩展

1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 右上角打开「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」
4. 选择本仓库下的 **`print-extension/extension`** 文件夹（不要选到 `print-extension` 或 `local-print-service`）
5. 确认扩展已启用（开关为蓝色）

### 3. 打开连接打印页

在前端侧边栏点击「**连接打印**」，进入连接打印页面。

### 4. 检查打印机列表

- 若扩展和前端都正常，页面会自动拉取打印机列表。
- **Windows** 下会显示本机已安装的打印机（如 Fax、Microsoft Print to PDF、ZD621R300dpi、ZDesigner 等）。
- 若显示「未检测到打印扩展」：
  1. 确认扩展已启用（`chrome://extensions` 中开关为蓝色）
  2. **重新加载扩展后务必刷新连接打印页面（F5）**，否则旧页面不会注入新脚本
  3. 点击页面上的「**重试检测扩展**」再试
  4. 若仍无效，可尝试关闭该标签页后重新打开 http://localhost:5173/connect-print

### 5. 测试「应用连接」

1. 连接方式选「**TCP/IP**」
2. IP 地址填例如 `192.168.1.100`，端口填 `9100`
3. 点击「**应用连接**」
4. 应提示「已添加连接：TCP 192.168.1.100:9100」，左侧列表里多出一条 TCP 打印机（当前为模拟，不会真连打印机）

### 6. 测试「打印当前行」

1. 在右侧「**选择模板**」下拉框选一个已有模板
2. 若有变量，可先「**导入 Excel**」并做好「**列绑定**」
3. 在左侧打印机列表中**选中一台打印机**（系统打印机或刚添加的 TCP 均可）
4. 在「模拟数据」区域点击「**打印当前行**」
5. 应弹出「**已发送打印**」（当前为 mock，不会真正出纸）

### 7. 测试「批量打印」

1. 保持已选模板、已导入 Excel、已选打印机
2. 点击「**批量打印（N 张）**」
3. 应弹出「**已发送批量打印：N 张**」

以上都成功即表示本地测试跑通。要真实出纸，再按下面「二、真实打印测试」启动 Node 服务并改扩展地址。

---

## 二、真实打印测试（ZPL 下发到打印机）

需要真正把 ZPL 发到打印机时：

1. 在 **`print-extension/extension/background.js`** 第 7 行，把 `LOCAL_SERVICE` 改为：`'http://127.0.0.1:8765'`
2. 在扩展目录下重新点击「重新加载」使扩展生效
3. 启动本地打印服务：
   ```bash
   cd print-extension/local-print-service
   npm install
   node server.js
   ```
4. 再按「一」中步骤 3～7 在连接打印页操作，即可真实打印（选系统打印机或 TCP 打印机均可）。

---

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

## 真实打印测试（ZPL 下发到打印机）

扩展已默认请求 `http://127.0.0.1:8765`，按下面步骤即可真正把内容打到打印机上。

1. **启动本地打印服务**（必须先启动，否则刷新列表或打印会报错）
   ```bash
   cd print-extension/local-print-service
   npm install
   node server.js
   ```
   看到 `本地打印服务已启动: http://127.0.0.1:8765` 即表示成功。

2. **确保扩展已加载**  
   在 Chrome 中加载本仓库下的 `print-extension/extension` 目录（开发者模式 → 加载已解压的扩展程序）。

3. **在「连接打印」页测试**
   - **方式一：选系统打印机（含 USB）**  
     列表中的「ZD621R300dpi」「ZDesigner for Developers」等为系统打印机，选中后选模板、点「打印当前行」或「批量打印」。服务会通过 Windows 原始打印把 ZPL 发到该打印机（USB 连接也可用）。
   - **方式二：TCP 打印机**  
     连接方式选 TCP/IP，填打印机 IP 与端口（如 9100），点「应用连接」。列表中会出现一条「TCP xxx:9100」，选中后打印即可走网络直连发 ZPL。

4. 若提示「刷新打印机列表失败」或「打印失败」，请确认：本地打印服务已启动、打印机已开机且未脱机、Zebra 驱动已安装。

5. **Zebra/ZDesigner 系统打印机：任务已提交但队列无任务、未出纸**
   - 本服务对打印机名含 ZD/Zebra/ZDesigner 的会自动加 Passthrough 分隔符 `${ ... }$`。
   - 若仍无效，请在打印机上右键 → **打印首选项** → **高级/其他** 中开启 **「Passthrough 模式」**（或 ZPL Passthrough），起止序列设为 `${` 与 `}$`。
   - 或在 **打印机属性 → 高级** 中尝试「直接打印到打印机」与「使用后台打印」切换后重试。

## 通信与接口

详见项目根目录 `docs/connect-print-extension-handover.md`。

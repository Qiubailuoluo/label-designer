/**
 * 本地打印服务：提供 /printers、/connection、/print、/print/batch
 * GET /printers 会返回「系统打印机」+「通过应用连接添加的打印机」
 */
const express = require('express');
const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const app = express();
// 允许浏览器扩展/页面跨域请求（本地服务仅监听 127.0.0.1）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PRINT_SERVICE_PORT || 8765;

// 通过「应用连接」添加的打印机：{ id, name, address, type: 'tcp'|'usb', config }
const addedPrinters = [];
let nextId = 1;

/** Windows 下枚举系统打印机，返回 { id, name, address }[] */
function getWindowsPrinterList() {
  if (process.platform !== 'win32') return [];
  try {
    const cmd = 'powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Printer | Select-Object Name, PortName | ConvertTo-Json -Compress"';
    const out = execSync(cmd, { encoding: 'utf8', windowsHide: true, timeout: 10000 });
    const data = JSON.parse(out.trim() || '[]');
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return arr.map((p, i) => ({
      id: 'win_' + i,
      name: (p.Name || p.name || '').trim() || '未命名',
      address: (p.PortName || p.portName || '').trim() || '',
    }));
  } catch (e) {
    console.warn('枚举 Windows 打印机失败:', e?.message);
    return [];
  }
}

function sendZPLToTCP(host, port, zpl, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    const t = setTimeout(() => {
      sock.destroy();
      reject(new Error('连接超时'));
    }, timeoutMs);
    sock.connect(Number(port), host, () => {
      sock.write(zpl, 'utf8', () => {
        clearTimeout(t);
        sock.end();
        resolve();
      });
    });
    sock.on('error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

// GET /printers：系统打印机 + 已添加的连接
app.get('/printers', (req, res) => {
  console.log('[GET /printers] 收到请求');
  const systemList = getWindowsPrinterList();
  const addedList = addedPrinters.map((p) => ({ id: p.id, name: p.name, address: p.address }));
  const list = [...systemList, ...addedList];
  console.log('[GET /printers] 返回 %d 台打印机', list.length);
  res.json({ list });
});

// POST /connection - 添加连接为打印机
app.post('/connection', (req, res) => {
  const { connectionType, config } = req.body || {};
  if (!connectionType || !config) {
    return res.status(400).json({ error: '缺少 connectionType 或 config' });
  }
  const id = `p_${nextId++}`;
  let name, address;
  if (connectionType === 'tcp') {
    name = `TCP ${config.tcp?.host || ''}:${config.tcp?.port || ''}`;
    address = `${config.tcp?.host || ''}:${config.tcp?.port || ''}`;
    addedPrinters.push({
      id,
      name,
      address,
      type: 'tcp',
      config: { host: config.tcp?.host || '', port: String(config.tcp?.port || '9100'), timeout: config.tcp?.timeout || 5 },
    });
  } else {
    name = `USB ${config.usb?.port || ''}`;
    address = config.usb?.port || '';
    addedPrinters.push({
      id,
      name,
      address,
      type: 'usb',
      config: { port: config.usb?.port || '', vendor: config.usb?.vendor || '' },
    });
  }
  res.json({ id, name, address });
});

/** Windows 系统打印机（含 USB）：PowerShell + .NET 发送原始 ZPL，不依赖 node 原生模块 */
function sendZPLToWindowsPrinter(printerName, zpl) {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('仅 Windows 支持系统打印机原始打印'));
  }
  const scriptPath = path.join(__dirname, 'send-raw-print.ps1');
  const tmpPath = path.join(os.tmpdir(), `zpl-${Date.now()}-${Math.random().toString(36).slice(2)}.zpl`);
  try {
    fs.writeFileSync(tmpPath, zpl, 'utf8');
    execSync('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-PrinterName', printerName,
      '-FilePath', tmpPath,
    ], { encoding: 'utf8', timeout: 30000, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    const stderr = (e.stderr && String(e.stderr).trim()) || '';
    const msg = stderr || e?.message || '打印失败';
    throw new Error(msg);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

// POST /print - 单条 ZPL（支持 TCP/应用连接 或 系统打印机 win_* + printerName）
app.post('/print', async (req, res) => {
  const { printerId, zpl, printerName } = req.body || {};
  if (!printerId || zpl == null) {
    return res.status(400).json({ error: '缺少 printerId 或 zpl' });
  }
  if (String(printerId).startsWith('win_')) {
    if (!printerName) return res.status(400).json({ error: '系统打印机需传 printerName' });
    try {
      // Zebra/ZDesigner 驱动常需 Passthrough 分隔符，否则任务可能不进队列或不出纸
      const isZebra = /zd|zebra|zdesigner/i.test(String(printerName));
      const zplToSend = isZebra ? ('${\n' + zpl + '\n}$') : zpl;
      console.log('[打印] 打印机名=%s, ZPL长度=%d%s', printerName, (zplToSend || '').length, isZebra ? ' (Passthrough)' : '');
      await sendZPLToWindowsPrinter(printerName, zplToSend);
      console.log('[打印] 已提交到系统打印队列');
      return res.status(200).end();
    } catch (e) {
      console.error('[打印] 失败:', e?.message);
      return res.status(500).json({ error: e?.message || String(e) });
    }
  }
  const p = addedPrinters.find((x) => x.id === printerId);
  if (!p) return res.status(404).json({ error: '打印机不存在' });
  try {
    if (p.type === 'tcp') {
      await sendZPLToTCP(p.config.host, p.config.port, zpl, (p.config.timeout || 5) * 1000);
    } else {
      return res.status(501).json({ error: 'USB 打印暂未实现，请使用 TCP 或选择系统打印机' });
    }
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// POST /print/batch - 批量 ZPL
app.post('/print/batch', async (req, res) => {
  const { printerId, zplList, printerName } = req.body || {};
  if (!printerId || !Array.isArray(zplList)) {
    return res.status(400).json({ error: '缺少 printerId 或 zplList' });
  }
  if (String(printerId).startsWith('win_')) {
    if (!printerName) return res.status(400).json({ error: '系统打印机需传 printerName' });
    try {
      const isZebra = /zd|zebra|zdesigner/i.test(String(printerName));
      for (const zpl of zplList) {
        const zplToSend = isZebra ? ('${\n' + zpl + '\n}$') : zpl;
        await sendZPLToWindowsPrinter(printerName, zplToSend);
      }
      return res.status(200).end();
    } catch (e) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  }
  const p = addedPrinters.find((x) => x.id === printerId);
  if (!p) return res.status(404).json({ error: '打印机不存在' });
  try {
    if (p.type === 'tcp') {
      const timeoutMs = (p.config.timeout || 5) * 1000;
      for (const zpl of zplList) {
        await sendZPLToTCP(p.config.host, p.config.port, zpl, timeoutMs);
      }
    } else {
      return res.status(501).json({ error: 'USB 打印暂未实现' });
    }
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('本地打印服务已启动: http://127.0.0.1:' + PORT);
});

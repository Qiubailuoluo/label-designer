/**
 * 本地打印服务：提供 /printers、/connection、/print、/print/batch
 * GET /printers 会返回「系统打印机」+「通过应用连接添加的打印机」
 */
const express = require('express');
const net = require('net');
const { execSync } = require('child_process');
const app = express();
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
  const systemList = getWindowsPrinterList();
  const addedList = addedPrinters.map((p) => ({ id: p.id, name: p.name, address: p.address }));
  res.json({ list: [...systemList, ...addedList] });
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

// POST /print - 单条 ZPL
app.post('/print', async (req, res) => {
  const { printerId, zpl } = req.body || {};
  if (!printerId || zpl == null) {
    return res.status(400).json({ error: '缺少 printerId 或 zpl' });
  }
  const p = addedPrinters.find((x) => x.id === printerId);
  if (!p) return res.status(404).json({ error: '打印机不存在或为系统打印机，请通过「应用连接」添加 TCP 打印机后打印' });
  try {
    if (p.type === 'tcp') {
      await sendZPLToTCP(p.config.host, p.config.port, zpl, (p.config.timeout || 5) * 1000);
    } else {
      return res.status(501).json({ error: 'USB 打印暂未实现，请使用 TCP 连接' });
    }
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// POST /print/batch - 批量 ZPL
app.post('/print/batch', async (req, res) => {
  const { printerId, zplList } = req.body || {};
  if (!printerId || !Array.isArray(zplList)) {
    return res.status(400).json({ error: '缺少 printerId 或 zplList' });
  }
  const p = addedPrinters.find((x) => x.id === printerId);
  if (!p) return res.status(404).json({ error: '打印机不存在或为系统打印机' });
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

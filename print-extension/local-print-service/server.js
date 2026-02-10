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

/** Windows 下根据打印机名查端口名，失败返回 null */
function getWindowsPrinterPort(printerName) {
  if (process.platform !== 'win32') return null;
  try {
    const escaped = printerName.replace(/'/g, "''");
    const cmd = `powershell -NoProfile -Command "(Get-Printer -Name '${escaped}' -ErrorAction Stop).PortName"`;
    const out = execSync(cmd, { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    return (out && out.trim()) || null;
  } catch (e) {
    return null;
  }
}

/** Windows 下根据端口名查使用该端口的系统打印机名，无则返回 null */
function getWindowsPrinterNameByPort(portName) {
  if (process.platform !== 'win32' || !portName || !String(portName).trim()) return null;
  try {
    const port = String(portName).trim().replace(/'/g, "''");
    const cmd = `powershell -NoProfile -Command "(Get-Printer | Where-Object { $_.PortName -eq '${port}' } | Select-Object -First 1 -ExpandProperty Name)"`;
    const out = execSync(cmd, { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    return (out && out.trim()) || null;
  } catch (e) {
    return null;
  }
}

/** 从 Windows 端口名解析出 IP（如 IP_192.168.1.100 或 192.168.1.100） */
function parsePortToIP(portName) {
  if (!portName || typeof portName !== 'string') return null;
  const s = portName.trim();
  const ipMatch = s.match(/^IP_(.+)$/) || (s.match(/^\d+\.\d+\.\d+\.\d+$/) ? [null, s] : null);
  if (!ipMatch) return null;
  const ip = ipMatch[1] || ipMatch[0];
  return /^\d+\.\d+\.\d+\.\d+$/.test(ip) ? ip : null;
}

/** 向 USB/COM/LPT 端口直写 ZPL（应用连接添加的 USB 打印机） */
function sendZPLToUSB(portName, zpl) {
  if (!portName || !portName.trim()) {
    throw new Error('USB 端口未配置，请在应用连接中填写设备/端口（如 COM3、USB001）');
  }
  const port = portName.trim();
  const tmpPath = path.join(os.tmpdir(), `zpl-usb-${Date.now()}-${Math.random().toString(36).slice(2)}.zpl`);
  try {
    // 末尾加换行，部分 Zebra 固件依赖此才执行
    const zplWithNewline = (zpl && !/\n\s*$/.test(zpl)) ? zpl + '\n' : zpl;
    fs.writeFileSync(tmpPath, zplWithNewline, 'utf8');
    const scriptPath = path.join(__dirname, 'send-raw-to-port.ps1');
    execSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath,
      '-PortName', port, '-FilePath', tmpPath,
    ], { encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('[打印] USB/端口 %s 直写成功', port);
  } catch (e) {
    const stderr = (e.stderr && String(e.stderr).trim()) || '';
    const msg = stderr || e?.message || 'USB 端口直写失败';
    throw new Error(msg);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
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

/** Windows 系统打印机：网络端口走 TCP 直连，USB/COM 走驱动队列（直写 USB 常被驱动占用且不出纸） */
async function sendZPLToWindowsPrinter(printerName, zpl) {
  if (process.platform !== 'win32') {
    throw new Error('仅 Windows 支持系统打印机原始打印');
  }
  const tmpPath = path.join(os.tmpdir(), `zpl-${Date.now()}-${Math.random().toString(36).slice(2)}.zpl`);
  try {
    // 纯 UTF-8 字节写入，无 BOM
    fs.writeFileSync(tmpPath, Buffer.from(zpl, 'utf8'));
    const portName = getWindowsPrinterPort(printerName);

    // 1) 端口为 IP 时直连 9100 发 ZPL，避免驱动假成功、队列无任务
    const ip = parsePortToIP(portName);
    if (ip) {
      try {
        await sendZPLToTCP(ip, 9100, zpl, 10000);
        console.log('[打印] 已通过 TCP %s:9100 直发', ip);
        return;
      } catch (tcpErr) {
        console.warn('[打印] TCP 直连失败，回退驱动:', tcpErr?.message || tcpErr);
      }
    }

    // 2) 系统打印机接在 USB/COM 时不再直写端口

    // 3) 走驱动队列。手动 CMD 跑脚本能出纸、Node 子进程不能 → 通过计划任务在用户会话中执行（与手动一致）
    const printerNameTrimmed = String(printerName).trim();
    const requestPath = path.join(os.tmpdir(), 'zpl-print-request.json');
    const runScriptPath = path.join(__dirname, 'run-print-job.ps1');
    const TASK_NAME = 'ZPLPrintFromNode';

    function ensureTask() {
      try {
        execSync(`schtasks /query /tn "${TASK_NAME}"`, { stdio: 'pipe', windowsHide: true });
      } catch (_) {
        const tr = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + runScriptPath + '"';
        execSync('schtasks /create /tn "' + TASK_NAME + '" /tr "' + tr.replace(/"/g, '\\"') + '" /sc once /st 00:00 /f', { encoding: 'utf8', windowsHide: true, cwd: __dirname });
        console.log('[打印] 已创建计划任务 %s（用于在用户会话中执行打印）', TASK_NAME);
      }
    }

    async function waitForRequestDone(timeoutMs) {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          fs.accessSync(requestPath);
        } catch (_) {
          return true;
        }
        await sleep(200);
      }
      return false;
    }

    ensureTask();
    fs.writeFileSync(requestPath, JSON.stringify({ printerName: printerNameTrimmed, zplPath: tmpPath }), 'utf8');
    try {
      execSync(`schtasks /run /tn "${TASK_NAME}"`, { encoding: 'utf8', timeout: 5000, windowsHide: true });
    } catch (e) {
      try { fs.unlinkSync(requestPath); } catch (_) {}
      throw new Error('启动打印任务失败: ' + (e?.message || e));
    }
    if (!(await waitForRequestDone(15000))) {
      try { fs.unlinkSync(requestPath); } catch (_) {}
      throw new Error('打印任务未在 15 秒内完成，请检查计划任务是否被禁用');
    }
    console.log('[打印] 已通过计划任务提交（端口: %s）', portName || '未知');
  } catch (e) {
    const msg = e?.message || '打印失败';
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
      // 与 Python win32print 一致：发纯 ZPL + UTF-8，不加 Passthrough（StartDocPrinter RAW）
      console.log('[打印] 打印机名=%s, ZPL长度=%d', printerName, (zpl || '').length);
      await sendZPLToWindowsPrinter(printerName, zpl);
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
    } else if (p.type === 'usb') {
      const port = p.config.port;
      const sysPrinter = getWindowsPrinterNameByPort(port);
      if (sysPrinter) {
        await sendZPLToWindowsPrinter(sysPrinter, zpl);
        console.log('[打印] USB 端口 %s 已转交系统打印机「%s」驱动队列', port, sysPrinter);
      } else {
        sendZPLToUSB(port, zpl);
      }
    } else {
      return res.status(501).json({ error: '不支持的打印机类型' });
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
      for (const zpl of zplList) {
        await sendZPLToWindowsPrinter(printerName, zpl);
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
    } else if (p.type === 'usb') {
      const port = p.config.port;
      const sysPrinter = getWindowsPrinterNameByPort(port);
      if (sysPrinter) {
        for (const zpl of zplList) {
          await sendZPLToWindowsPrinter(sysPrinter, zpl);
        }
        console.log('[打印] 批量 USB 端口 %s 已转交系统打印机「%s」驱动队列', port, sysPrinter);
      } else {
        for (const zpl of zplList) {
          sendZPLToUSB(port, zpl);
        }
      }
    } else {
      return res.status(501).json({ error: '不支持的打印机类型' });
    }
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('本地打印服务已启动: http://127.0.0.1:' + PORT);
});

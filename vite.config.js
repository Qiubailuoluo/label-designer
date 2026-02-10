import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { execSync } from 'child_process';
// Windows 下枚举系统打印机，供开发时列表不为空
function getWindowsPrinterList() {
    if (process.platform !== 'win32')
        return [];
    try {
        const cmd = 'powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Printer | Select-Object Name, PortName | ConvertTo-Json -Compress"';
        const out = execSync(cmd, { encoding: 'utf8', windowsHide: true, timeout: 10000 });
        const data = JSON.parse(out.trim() || '[]');
        const arr = Array.isArray(data) ? data : data ? [data] : [];
        return arr.map((p, i) => ({
            id: 'win_' + i,
            name: (p.Name ?? p.name ?? '').trim() || '未命名',
            address: (p.PortName ?? p.portName ?? '').trim() || '',
        }));
    }
    catch {
        return [];
    }
}
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        // 开发环境模拟「连接打印」接口，GET /printers 返回本机系统打印机（Windows）
        {
            name: 'mock-print-api',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const url = req.url?.split('?')[0] || '';
                    if (!url.startsWith('/api/print/'))
                        return next();
                    res.setHeader('Content-Type', 'application/json');
                    if (url === '/api/print/printers' && req.method === 'GET') {
                        const list = getWindowsPrinterList();
                        res.end(JSON.stringify({ list }));
                        return;
                    }
                    if (url === '/api/print/connection' && req.method === 'POST') {
                        let body = '';
                        req.on('data', (ch) => { body += ch; });
                        req.on('end', () => {
                            try {
                                const { connectionType, config } = JSON.parse(body) || {};
                                const id = 'mock_' + Date.now();
                                const name = connectionType === 'tcp'
                                    ? `TCP ${config?.tcp?.host || ''}:${config?.tcp?.port || ''}`
                                    : `USB ${config?.usb?.port || ''}`;
                                const address = connectionType === 'tcp'
                                    ? `${config?.tcp?.host || ''}:${config?.tcp?.port || ''}`
                                    : config?.usb?.port || '';
                                res.end(JSON.stringify({ id, name, address }));
                            }
                            catch {
                                res.statusCode = 400;
                                res.end(JSON.stringify({ error: '无效请求体' }));
                            }
                        });
                        return;
                    }
                    if (url === '/api/print/print' && req.method === 'POST') {
                        let body = '';
                        req.on('data', (ch) => { body += ch; });
                        req.on('end', () => {
                            res.statusCode = 200;
                            res.end();
                        });
                        return;
                    }
                    if (url === '/api/print/print/batch' && req.method === 'POST') {
                        let body = '';
                        req.on('data', (ch) => { body += ch; });
                        req.on('end', () => {
                            res.statusCode = 200;
                            res.end();
                        });
                        return;
                    }
                    next();
                });
            },
        },
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
});

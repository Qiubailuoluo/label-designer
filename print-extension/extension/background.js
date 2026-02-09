/**
 * Background：根据 type 请求打印接口（本地前端 mock 或 8765 真实服务）
 * 当前使用「本地前端」：npm run dev 时 Vite 提供 /api/print/* 模拟，无需启动 Node 服务即可跑通流程。
 * 真实打印时改为：'http://127.0.0.1:8765'
 */
//const LOCAL_SERVICE = 'http://localhost:5173/api/print';
const LOCAL_SERVICE = 'http://127.0.0.1:8765';


function fetchLocal(path, options = {}) {
  const base = LOCAL_SERVICE;
  const url = base.endsWith('/') ? base + path.replace(/^\//, '') : (path.startsWith('/') ? base + path : base + '/' + path);
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, requestId, payload } = message;

  (async () => {
    try {
      switch (type) {
        case 'PING':
          sendResponse({ success: true, data: true });
          return;

        case 'GET_PRINTERS': {
          const res = await fetchLocal('printers');
          if (!res.ok) throw new Error(await res.text() || res.statusText);
          const json = await res.json();
          const list = json.list ?? json;
          sendResponse({ success: true, data: Array.isArray(list) ? list : [] });
          return;
        }

        case 'ADD_CONNECTION': {
          if (!payload?.connectionType) throw new Error('缺少 connectionType');
          const res = await fetchLocal('connection', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text() || res.statusText);
          const data = await res.json();
          sendResponse({ success: true, data });
          return;
        }

        case 'PRINT_ZPL': {
          if (!payload?.printerId || payload?.zpl == null) throw new Error('缺少 printerId 或 zpl');
          const res = await fetchLocal('print', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text() || res.statusText);
          sendResponse({ success: true });
          return;
        }

        case 'PRINT_ZPL_BATCH': {
          if (!payload?.printerId || !Array.isArray(payload?.zplList)) throw new Error('缺少 printerId 或 zplList');
          const res = await fetchLocal('print/batch', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text() || res.statusText);
          sendResponse({ success: true });
          return;
        }

        default:
          sendResponse({ success: false, error: '未知请求类型: ' + type });
      }
    } catch (e) {
      sendResponse({ success: false, error: e?.message || String(e) });
    }
  })();

  return true;
});

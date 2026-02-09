/**
 * Background：根据 type 请求本地打印服务，将结果回传给 content script
 * 默认请求「前端本地」开发地址，便于先跑通测试；正式用本地打印服务时改为 PRINT_SERVICE_ORIGIN 或下方 8765
 */
// 开发联调：请求前端 dev 的模拟接口（npm run dev 时 Vite 会提供 /api/print/* 模拟）
const LOCAL_SERVICE = 'http://localhost:5173/api/print';
// 使用独立本地打印服务时改为：'http://127.0.0.1:8765'，且 path 为 /printers、/connection、/print、/print/batch

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
            body: JSON.stringify({ printerId: payload.printerId, zpl: payload.zpl }),
          });
          if (!res.ok) throw new Error(await res.text() || res.statusText);
          sendResponse({ success: true });
          return;
        }

        case 'PRINT_ZPL_BATCH': {
          if (!payload?.printerId || !Array.isArray(payload?.zplList)) throw new Error('缺少 printerId 或 zplList');
          const res = await fetchLocal('print/batch', {
            method: 'POST',
            body: JSON.stringify({ printerId: payload.printerId, zplList: payload.zplList }),
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

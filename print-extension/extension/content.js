/**
 * Content Script：接收页面 postMessage，直接请求本地打印服务（避免 MV3 service worker 休眠导致响应丢失）
 */
const PAGE_SOURCE = 'connect-print-page';
const EXT_SOURCE = 'connect-print-extension';
const LOCAL_SERVICE = 'http://127.0.0.1:8765';

function fetchLocal(path, options = {}) {
  const url = path.startsWith('/') ? LOCAL_SERVICE + path : LOCAL_SERVICE + '/' + path;
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
}

function reply(requestId, success, data, error) {
  window.postMessage({ source: EXT_SOURCE, requestId, success, data, error }, '*');
}

async function handleMessageFromPage(event) {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || typeof data !== 'object' || data.source !== PAGE_SOURCE) return;
  const { type, requestId, payload } = data;
  if (!type || requestId === undefined) return;

  try {
    switch (type) {
      case 'PING':
        reply(requestId, true, true);
        return;

      case 'GET_PRINTERS': {
        const res = await fetchLocal('printers');
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        const json = await res.json();
        const list = json.list ?? json;
        reply(requestId, true, Array.isArray(list) ? list : []);
        return;
      }

      case 'ADD_CONNECTION': {
        if (!payload?.connectionType) throw new Error('缺少 connectionType');
        const res = await fetchLocal('connection', { method: 'POST', body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        const data = await res.json();
        reply(requestId, true, data);
        return;
      }

      case 'PRINT_ZPL': {
        if (!payload?.printerId || payload?.zpl == null) throw new Error('缺少 printerId 或 zpl');
        const res = await fetchLocal('print', { method: 'POST', body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        reply(requestId, true);
        return;
      }

      case 'PRINT_ZPL_BATCH': {
        if (!payload?.printerId || !Array.isArray(payload?.zplList)) throw new Error('缺少 printerId 或 zplList');
        const res = await fetchLocal('print/batch', { method: 'POST', body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        reply(requestId, true);
        return;
      }

      default:
        reply(requestId, false, null, '未知请求类型: ' + type);
    }
  } catch (e) {
    reply(requestId, false, null, e?.message || String(e));
  }
}

window.addEventListener('message', (e) => { handleMessageFromPage(e).catch(() => {}); });

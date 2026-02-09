/**
 * Content Script：接收页面 postMessage，转发给 background；接收 background 回复后回传页面
 */
const PAGE_SOURCE = 'connect-print-page';
const EXT_SOURCE = 'connect-print-extension';

function handleMessageFromPage(event) {
  if (event.source !== window || event.data?.source !== PAGE_SOURCE) return;
  const { type, requestId, payload } = event.data;
  chrome.runtime.sendMessage({ type, requestId, payload }, (response) => {
    if (chrome.runtime.lastError) {
      window.postMessage({
        source: EXT_SOURCE,
        requestId,
        success: false,
        error: chrome.runtime.lastError.message || '扩展通信失败',
      }, '*');
      return;
    }
    window.postMessage({
      source: EXT_SOURCE,
      requestId,
      success: response?.success ?? false,
      data: response?.data,
      error: response?.error,
    }, '*');
  });
}

window.addEventListener('message', handleMessageFromPage);

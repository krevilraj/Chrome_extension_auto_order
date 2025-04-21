(() => {
  if (window.__NEPSE_CAPTURED__) return;
  window.__NEPSE_CAPTURED__ = [];

  // Native fetch
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    try {
      const [url, config] = args;
      const body = config?.body || null;
      const method = config?.method || "GET";
      if (method === "POST" && body) {
        window.__NEPSE_CAPTURED__.push({ url, method, body, time: Date.now(), type: "fetch" });
        console.log("📡 FETCH captured:", url, body);
      }
    } catch (e) {}
    return origFetch.apply(this, args);
  };

  // Native XHR
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method;
    this._url = url;
    return open.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this._method === "POST" && body) {
      window.__NEPSE_CAPTURED__.push({ url: this._url, method: this._method, body, time: Date.now(), type: "xhr" });
      console.log("📡 XHR captured:", this._url, body);
    }
    return send.apply(this, arguments);
  };

  // Angular Zone.js patch
  const interval = setInterval(() => {
    if (window.Zone && Zone.__symbol__) {
      const symbol = Zone.__symbol__('fetchTask');
      const origScheduleTask = Zone.prototype.scheduleTask;

      Zone.prototype.scheduleTask = function (task) {
        try {
          if (task.source === 'fetch') {
            const data = task.data || {};
            if (data?.url && data?.init?.method === "POST") {
              const body = data?.init?.body;
              window.__NEPSE_CAPTURED__.push({
                url: data.url,
                method: "POST",
                body,
                time: Date.now(),
                type: "zone-fetch"
              });
              console.log("📡 Zone FETCH captured:", data.url, body);
            }
          }
        } catch (e) {}
        return origScheduleTask.call(this, task);
      };
      clearInterval(interval);
    }
  }, 50);
})();
function renderOverlay() {
  if (!document.body) return setTimeout(renderOverlay, 50);
  if (document.getElementById("nepse-ui")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "nepse-ui";
  wrapper.style.cssText = "position:fixed;bottom:10px;right:10px;z-index:999999;background:#fff;border:1px solid #ccc;padding:10px;font-family:sans-serif;max-width:320px";

  const btn = document.createElement("button");
  btn.textContent = "Show Last";
  const retry = document.createElement("button");
  retry.textContent = "Retry";
  retry.disabled = true;
  retry.style.marginLeft = "5px";

  const output = document.createElement("pre");
  output.style.cssText = "max-height:150px;overflow:auto;margin-top:10px;background:#f0f0f0;padding:5px";

  btn.onclick = () => {
    const list = window.__NEPSE_CAPTURED__;
    if (!list || !list.length) {
      output.textContent = "❌ Nothing captured yet.";
      return;
    }
    const latest = list[list.length - 1];
    retry.disabled = false;
    output.textContent = `TYPE: ${latest.type}\nURL: ${latest.url}\nTime: ${new Date(latest.time).toLocaleTimeString()}\n\n${typeof latest.body === 'string' ? latest.body : JSON.stringify(latest.body, null, 2)}`;
    retry._payload = latest;
  };

  retry.onclick = () => {
    const req = retry._payload;
    fetch(req.url, {
      method: req.method,
      body: req.body,
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    }).then(r => r.text()).then(() => alert("✅ Retried")).catch(() => alert("❌ Retry failed"));
  };

  wrapper.appendChild(btn);
  wrapper.appendChild(retry);
  wrapper.appendChild(output);
  document.body.appendChild(wrapper);
}

renderOverlay();
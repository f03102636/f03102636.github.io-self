// 上鎖的內容：用輸入的密碼在瀏覽器裡解密（AES-256-GCM，PBKDF2-SHA256）
(() => {
  if (!document.querySelector("[data-lock]") || !window.crypto?.subtle) return;

  const STORE = "site-pass";
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const keys = new Map();
  const remember = (p) => { try { localStorage.setItem(STORE, p); } catch (e) {} };
  const recall = () => { try { return localStorage.getItem(STORE); } catch (e) { return null; } };
  const forget = () => { try { localStorage.removeItem(STORE); } catch (e) {} };

  const keyFor = (pass, salt, iter) => {
    const id = `${pass}|${salt}|${iter}`;
    if (!keys.has(id)) {
      keys.set(id, crypto.subtle
        .importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"])
        .then((base) => crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: b64(salt), iterations: +iter, hash: "SHA-256" },
          base, { name: "AES-GCM", length: 256 }, false, ["decrypt"])));
    }
    return keys.get(id);
  };

  const openBox = async (box, pass) => {
    const { salt, iter, iv, ct } = box.dataset;
    const key = await keyFor(pass, salt, iter);
    const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(iv) }, key, b64(ct));
    const tpl = document.createElement("template");
    tpl.innerHTML = new TextDecoder().decode(buf);
    const wrap = document.createElement("div");
    wrap.className = box.classList.contains("is-partial") ? "unlocked is-partial" : "unlocked";
    wrap.append(tpl.content);
    box.replaceWith(wrap);
  };

  // 打開目前所有的鎖；打開後如果裡面還有鎖（例如整頁裡的抽屜），繼續開
  const openAll = async (pass) => {
    let boxes = [...document.querySelectorAll("[data-lock]")];
    while (boxes.length) {
      for (const box of boxes) await openBox(box, pass);
      boxes = [...document.querySelectorAll("[data-lock]")];
    }
    document.dispatchEvent(new CustomEvent("content:unlocked"));
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  };

  const wire = () => {
    document.querySelectorAll("[data-lock-form]:not([data-wired])").forEach((form, i) => {
      form.dataset.wired = "1";
      const box = form.closest("[data-lock]");
      const input = form.querySelector("input");
      const btn = form.querySelector("button");
      const err = box.querySelector("[data-lock-error]");
      if (i === 0 && !box.classList.contains("is-partial")) input.focus({ preventScroll: true });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.textContent = "";
        btn.disabled = true;
        btn.textContent = "開鎖中…";
        try {
          await openAll(input.value);
          remember(input.value);
        } catch (e2) {
          err.textContent = "密碼不對，再試一次。";
          btn.disabled = false;
          btn.textContent = "打開";
          input.select();
        }
      });
    });
  };

  const saved = recall();
  if (saved) {
    openAll(saved).catch(() => { forget(); wire(); });
  } else {
    wire();
  }
})();

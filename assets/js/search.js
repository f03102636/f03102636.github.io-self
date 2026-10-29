// 站內搜尋：讀 search.json，在標題、標籤、內文裡找關鍵字
(() => {
  const root = document.querySelector("[data-search]");
  if (!root) return;

  const base = (root.dataset.base || "/").replace(/\/$/, "");
  const form = root.querySelector("form");
  const input = root.querySelector("input");
  const status = root.querySelector("[data-status]");
  const list = root.querySelector("[data-results]");
  const idle = status.textContent;
  let index = null;

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const highlight = (text, q) => {
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  };
  const snippet = (text, q) => {
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text.slice(0, 80) + (text.length > 80 ? "…" : "");
    const start = Math.max(0, i - 30);
    const end = Math.min(text.length, i + q.length + 50);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  };

  const load = async () => {
    if (index) return index;
    const res = await fetch(base + "/search.json");
    if (!res.ok) throw new Error(res.status);
    index = await res.json();
    return index;
  };

  const run = async (raw) => {
    const q = raw.trim().toLowerCase();
    const url = new URL(location.href);
    if (q) url.searchParams.set("q", raw.trim()); else url.searchParams.delete("q");
    history.replaceState(null, "", url);

    list.innerHTML = "";
    if (!q) { status.textContent = idle; return; }

    let data;
    try { data = await load(); }
    catch (e) { status.textContent = "搜尋資料載入失敗，重新整理頁面後再試一次。"; return; }

    const hits = data
      .map((p) => {
        const inTitle = p.title.toLowerCase().includes(q);
        const inTags = p.tags.some((t) => t.toLowerCase().includes(q));
        const inText = p.text.toLowerCase().includes(q);
        return { p, score: (inTitle ? 3 : 0) + (inTags ? 2 : 0) + (inText ? 1 : 0) };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!hits.length) {
      status.textContent = `沒有找到「${raw.trim()}」。試試更短的關鍵字，或到標籤頁找找。`;
      return;
    }
    status.textContent = `找到 ${hits.length} 篇。`;
    list.innerHTML = hits.map(({ p }) => `
      <li>
        <a href="${esc(base + p.url)}">${highlight(p.title, q)}</a>
        <p class="result-meta">${esc(p.date)}${p.tags.length ? "　" + p.tags.map((t) => "#" + esc(t)).join(" ") : ""}</p>
        <p class="result-snippet">${highlight(snippet(p.text, q), q)}</p>
      </li>`).join("");
  };

  form.addEventListener("submit", (e) => { e.preventDefault(); run(input.value); });
  let timer;
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => run(input.value), 200); });

  const initial = new URL(location.href).searchParams.get("q");
  if (initial) { input.value = initial; run(initial); }
})();

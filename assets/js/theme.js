// 選單：一次只開一個，點外面或按 Esc 關閉
(() => {
  const groups = [...document.querySelectorAll("[data-nav-group]")];
  groups.forEach((g) => g.addEventListener("toggle", () => {
    if (g.open) groups.forEach((o) => { if (o !== g) o.open = false; });
  }));
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-nav-group]")) groups.forEach((g) => (g.open = false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = groups.find((g) => g.open);
    if (open) { open.open = false; open.querySelector("summary").focus(); }
  });
})();

// 深淺色切換：記住選擇，沒選過就跟著系統
(() => {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const root = document.documentElement;
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = () => root.dataset.theme || (systemDark() ? "dark" : "light");
  const label = () => btn.setAttribute("aria-label", current() === "dark" ? "切換成淺色模式" : "切換成深色模式");
  label();
  btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });
})();

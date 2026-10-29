// 學習計畫：依今天日期標出目前週次、倒數、這個月、接下來的事
const initPlan = (root) => {
  if (root.dataset.planReady) return;
  root.dataset.planReady = "1";

  const DAY = 86400000;
  const toDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = toDate(root.dataset.start);
  const entry = toDate(root.dataset.entry);
  const week = Math.floor((today - start) / DAY / 7) + 1;
  const inYear = week >= 1 && week <= 49;
  const yearPct = Math.min(100, Math.max(0, ((today - start) / DAY / 7 / 49) * 100));

  // 目前階段
  let phaseName = "";
  const ph = [...root.querySelectorAll("[data-phase-w0]")].find((el) => week >= +el.dataset.phaseW0 && week <= +el.dataset.phaseW1);
  if (ph) {
    ph.classList.add("is-now");
    phaseName = ph.dataset.phaseName || ph.querySelector("h3")?.textContent.replace(/^P\d/, "") || "";
  }

  // 摘要卡
  const box = root.querySelector("[data-now]");
  if (box) {
    const wEl = box.querySelector("[data-now-week]");
    wEl.textContent = week < 1 ? "還沒開始" : week > 49 ? "已完成" : ("plain" in wEl.dataset ? "" : "W") + week;
    const phaseEl = box.querySelector("[data-now-phase]");
    if (phaseEl) phaseEl.textContent = phaseName || "—";
    box.querySelector("[data-now-days]").textContent = Math.max(0, Math.ceil((entry - today) / DAY));
    const bar = box.querySelector("[data-progress]");
    if (bar) bar.style.width = yearPct + "%";
    box.hidden = false;
  }

  // 「今天」標記（時間軸、科目進度條）
  if (inYear) {
    for (const m of root.querySelectorAll("[data-today]")) {
      m.style.left = yearPct + "%";
      m.hidden = false;
    }
  }

  // 里程碑與考試：已過、本週、下一個
  let next = null;
  for (const li of root.querySelectorAll("[data-ms-start]")) {
    const s = toDate(li.dataset.msStart);
    const e = toDate(li.dataset.msEnd);
    if (today > e) li.classList.add("is-done");
    else if (today >= s) { li.classList.add("is-now"); next = next || li; }
    else if (!next) { li.classList.add("is-next"); next = li; }
  }
  const nextEl = root.querySelector("[data-now-next]");
  if (nextEl) {
    if (next) {
      const text = next.querySelector(".ms-text");
      const wk = next.querySelector(".ms-week");
      nextEl.textContent = (wk ? wk.textContent + "　" : "") + (text ? text.textContent : "");
    } else nextEl.textContent = "都完成了";
  }

  // 首頁「接下來」：顯示還沒結束的前 4 件
  const evList = root.querySelector("[data-events]");
  if (evList) {
    let shown = 0;
    for (const li of evList.querySelectorAll("[data-ev-start]")) {
      const s = toDate(li.dataset.evStart);
      const e = toDate(li.dataset.evEnd);
      const upcoming = today <= e;
      li.hidden = !(upcoming && shown < 4);
      if (li.hidden) continue;
      shown++;
      const days = Math.round((s - today) / DAY);
      li.querySelector("[data-ev-left]").textContent = days <= 0 ? "進行中" : `${days} 天後`;
    }
    if (!shown) evList.insertAdjacentHTML("afterend", '<p class="empty-note">這一年的計畫都走完了。</p>');
  }

  // 這個月
  const ym = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}`;
  const row = root.querySelector(`[data-month-row="${ym}"]`);
  if (row) row.classList.add("is-now");

  const cards = [...root.querySelectorAll("[data-month-card]")];
  if (cards.length) {
    const hit = cards.find((c) => c.dataset.monthCard === ym) ||
      (ym > cards[cards.length - 1].dataset.monthCard ? cards[cards.length - 1] : cards[0]);
    cards.forEach((c) => (c.hidden = c !== hit));
  }

  const month = root.querySelector(`[data-month="${ym}"]`);
  if (month) {
    month.open = true;
    month.classList.add("is-now");
    const tag = month.querySelector(".month-now");
    if (tag) tag.hidden = false;
  } else {
    const first = root.querySelector("[data-month]");
    if (first) first.open = true;
  }
};

document.querySelectorAll("[data-plan]").forEach(initPlan);
document.addEventListener("content:unlocked", () => document.querySelectorAll("[data-plan]").forEach(initPlan));

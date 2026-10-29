import { HtmlBasePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownItAnchor from "markdown-it-anchor";
import markdownItContainer from "markdown-it-container";
import markdownItMark from "markdown-it-mark";
import texmath from "markdown-it-texmath";
import katex from "katex";
import site from "./_data/site.js";
import crypto from "node:crypto";

const TZ = "Asia/Taipei";
const POSTS_GLOB = "posts/**/*.md";

// ---------- 小工具 ----------
const ymd = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date(date));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
};

// 去掉 ::: secret 的內容，避免摘要、目錄、搜尋把它洩漏出去
const dropSecrets = (html = "") => String(html).replace(/<!--LOCK-START-->[\s\S]*?<!--LOCK-END-->/g, " ");

const stripHtml = (html = "") =>
  dropSecrets(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<annotation[\s\S]*?<\/annotation>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// 標題錨點：保留中文、日文，空白換成連字號
const slugifyHeading = (s) =>
  String(s).trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-_]/gu, "");

const tagSlug = (tag) =>
  String(tag).trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\/?#%\\]/g, "");

const live = (api, glob) => api.getFilteredByGlob(glob).filter((p) => !p.data.draft);
const livePosts = (api) => live(api, POSTS_GLOB);
// 小屋的各個房間（資料夾）
const ROOMS = { notes: "posts/**/*.md", food: "food/**/*.md", travel: "travel/**/*.md", daily: "daily/**/*.md" };

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "publicPosts", limit: 20 },
    metadata: {
      language: "zh-Hant-TW",
      title: site.title,
      subtitle: site.description,
      base: site.url + "/",
      author: { name: site.author },
    },
  });

  // ---------- Markdown ----------
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ linkify: true });
    md.use(markdownItAnchor, { level: [2, 3], slugify: slugifyHeading, tabIndex: false });
    md.use(markdownItMark);

    const callouts = [["tip", "小提醒"], ["note", "筆記"], ["warn", "注意"]];
    for (const [name, label] of callouts) {
      md.use(markdownItContainer, name, {
        render(tokens, idx) {
          const token = tokens[idx];
          if (token.nesting === 1) {
            const custom = token.info.trim().slice(name.length).trim();
            return `<aside class="callout callout-${name}"><p class="callout-title">${md.utils.escapeHtml(custom || label)}</p>\n`;
          }
          return "</aside>\n";
        },
      });
    }

    // ::: secret 包住的段落會被加密，要輸入密碼才看得到
    md.use(markdownItContainer, "secret", {
      render(tokens, idx) {
        return tokens[idx].nesting === 1 ? "\n<!--LOCK-START-->\n" : "\n<!--LOCK-END-->\n";
      },
    });

    md.use(texmath, {
      engine: katex,
      delimiters: "dollars",
      katexOptions: { throwOnError: false, output: "html" },
    });
  });

  eleventyConfig.addGlobalData("buildYear", ymd(Date.now()).y);

  // ---------- 文章集合 ----------
  eleventyConfig.addCollection("posts", (api) => livePosts(api));
  for (const [name, glob] of Object.entries(ROOMS)) {
    if (name !== "notes") eleventyConfig.addCollection(name, (api) => live(api, glob));
  }
  const allEntries = (api) =>
    Object.values(ROOMS).flatMap((g) => live(api, g)).sort((a, b) => a.date - b.date);
  eleventyConfig.addCollection("entries", allEntries);
  // 公開的文章（給 RSS 和搜尋用）：整篇上鎖、或含有 ::: secret 的都不放
  eleventyConfig.addCollection("publicPosts", (api) =>
    allEntries(api).filter((p) => !p.data.locked && !/^:::\s*secret/m.test(p.rawInput || "")));

  eleventyConfig.addCollection("tagList", (api) => {
    const counts = new Map();
    for (const post of Object.values(ROOMS).flatMap((g) => live(api, g))) {
      for (const tag of post.data.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
      .map(([name, count]) => ({ name, count }));
  });

  // ---------- 篩選器 ----------
  eleventyConfig.addFilter("dateZh", (date) => {
    const { y, m, d } = ymd(date);
    return `${y} 年 ${m} 月 ${d} 日`;
  });
  eleventyConfig.addFilter("dateShort", (date) => {
    const { m, d } = ymd(date);
    return `${m} 月 ${d} 日`;
  });
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString());

  eleventyConfig.addFilter("groupByYear", (posts = []) => {
    const groups = [];
    for (const post of posts) {
      const { y } = ymd(post.date);
      let group = groups.find((g) => g.year === y);
      if (!group) groups.push((group = { year: y, posts: [] }));
      group.posts.push(post);
    }
    return groups;
  });

  eleventyConfig.addFilter("readingMinutes", (html) => {
    const text = stripHtml(html);
    const cjk = (text.match(/[぀-ヿ㐀-鿿豈-﫿]/g) || []).length;
    const words = text.replace(/[぀-ヿ㐀-鿿豈-﫿]/g, " ")
      .split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    return Math.max(1, Math.ceil(cjk / 400 + words / 200));
  });

  eleventyConfig.addFilter("excerpt", (post) => {
    if (post.data.description) return post.data.description;
    const first = dropSecrets(post.content || "").match(/<p>([\s\S]*?)<\/p>/);
    const text = stripHtml(first ? first[1] : "");
    return text.length > 90 ? text.slice(0, 90) + "…" : text;
  });

  eleventyConfig.addFilter("excerptLong", (post) => {
    const text = stripHtml(String(post.content || "").replace(/<(pre|table|h[1-6])[\s\S]*?<\/\1>/gi, " "));
    const base = post.data.description ? post.data.description + " " : "";
    const all = (base + text).trim();
    return all.length > 130 ? all.slice(0, 130) + "…" : all;
  });

  eleventyConfig.addFilter("plainText", (html) => stripHtml(html).slice(0, 4000));

  eleventyConfig.addFilter("toc", (html) => {
    const items = [];
    const re = /<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
    let m;
    const clean = dropSecrets(html);
    while ((m = re.exec(clean))) items.push({ level: Number(m[1]), id: m[2], text: stripHtml(m[3]) });
    return items;
  });

  // 計畫用：2026-09-28 → 2026/9/28；範圍 → 9/28–10/4
  const parseYmd = (s) => s.split("-").map(Number);
  eleventyConfig.addFilter("md", (s) => { const [y, m, d] = parseYmd(s); return `${m}/${d}`; });
  eleventyConfig.addFilter("ymd", (s) => { const [y, m, d] = parseYmd(s); return `${y}/${m}/${d}`; });
  eleventyConfig.addFilter("pct", (week, total = 49) => (((week - 1) / total) * 100).toFixed(2));
  eleventyConfig.addFilter("groupBy", (arr = [], key) => {
    const groups = [];
    for (const item of arr) {
      let g = groups.find((x) => x.key === item[key]);
      if (!g) groups.push((g = { key: item[key], items: [] }));
      g.items.push(item);
    }
    return groups;
  });
  eleventyConfig.addFilter("splitBy", (s = "", sep = ";") => String(s).split(sep).map((x) => x.trim()).filter(Boolean));

  eleventyConfig.addFilter("dateDot", (date) => {
    const { y, m, d } = ymd(date);
    return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
  });
  eleventyConfig.addFilter("head", (arr = [], n) => arr.slice(0, n));

  eleventyConfig.addFilter("withTag", (posts = [], tag) =>
    posts.filter((p) => (p.data.tags || []).includes(tag)));

  eleventyConfig.addFilter("hasMath", (html) => String(html).includes('class="katex'));
  eleventyConfig.addFilter("tagUrl", (tag) => `/tags/${tagSlug(tag)}/`);

  // ---------- 密碼保護 ----------
  // 有 locked 的頁面，主內容會在建置時用 AES-256-GCM 加密；密碼放在 GitHub Secret「SITE_PASSWORD」
  const PASSWORD = process.env.SITE_PASSWORD || "";
  const SALT = crypto.randomBytes(16);
  const ITER = 150000;
  const KEY = PASSWORD ? crypto.pbkdf2Sync(PASSWORD, SALT, ITER, 32, "sha256") : null;
  let warned = false;

  const lockBox = (inner, partial) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    const ct = Buffer.concat([cipher.update(inner, "utf8"), cipher.final(), cipher.getAuthTag()]);
    const icon = `<svg class="lockbox-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>`;
    const title = partial ? "這段被收進抽屜了" : "這個房間上了鎖";
    const text = partial ? "輸入密碼就能打開。" : "輸入密碼就能進去。同一台裝置輸入一次，其他上鎖的地方也會一起打開。";
    return `<div class="lockbox${partial ? " is-partial" : ""}" data-lock data-salt="${SALT.toString("base64")}" data-iter="${ITER}" data-iv="${iv.toString("base64")}" data-ct="${ct.toString("base64")}">
  ${icon}
  <p class="lockbox-title">${title}</p>
  <p class="lockbox-text">${text}</p>
  <form class="lockbox-form" data-lock-form>
    <input type="password" aria-label="密碼" autocomplete="current-password" placeholder="輸入密碼" required>
    <button type="submit">打開</button>
  </form>
  <p class="lockbox-error" data-lock-error aria-live="polite"></p>
  <noscript><p class="lockbox-error">需要開啟 JavaScript 才能打開。</p></noscript>
</div>`;
  };

  eleventyConfig.addTransform("lock", function (html) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) return html;
    const full = /<!--LOCK-PAGE-START-->([\s\S]*?)<!--LOCK-PAGE-END-->/;
    const part = /<!--LOCK-START-->([\s\S]*?)<!--LOCK-END-->/g;
    if (!full.test(html) && !/<!--LOCK-START-->/.test(html)) return html;
    if (!KEY) {
      if (process.env.CI) throw new Error("沒有設定 SITE_PASSWORD，上鎖的內容無法加密。請到 GitHub 的 Settings → Secrets and variables → Actions 新增。");
      if (!warned) { console.warn("[lock] 本機沒有設定 SITE_PASSWORD，上鎖內容以明文輸出（只在本機預覽）"); warned = true; }
      return html.replace(full, "$1").replace(part, "$1");
    }
    // 先加密段落，再加密整頁（整頁裡的段落已經是密文，等於兩層）
    let out = html.replace(part, (_, inner) => lockBox(inner, true));
    out = out.replace(full, (_, inner) => lockBox(inner, false));
    return out;
  });

  // ---------- 靜態檔案 ----------
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({
    "node_modules/katex/dist/katex.min.css": "assets/katex/katex.min.css",
    "node_modules/katex/dist/fonts": "assets/katex/fonts",
  });

  eleventyConfig.setServerOptions({ showAllHosts: false });

  return {
    // 文章不經過模板引擎，程式碼裡的 {{ }} 才不會被吃掉
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
  };
}

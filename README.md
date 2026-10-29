# 菜菜的小屋

用 [Eleventy](https://www.11ty.dev/) 做的個人網站，推到 GitHub 後會自動建置、發布到 GitHub Pages。

首頁是一棟房子，每個房間是一個區塊：

| 房間 | 內容 | 文章放在哪個資料夾 | 範本 |
| --- | --- | --- | --- |
| 客廳 | 關於我 | 改 `about.md` | |
| 書房 | 學習筆記、學習計畫 | `posts` | `templates/新文章範本.md` |
| 廚房 | 食記 | `food` | `templates/食記範本.md` |
| 玄關 | 旅遊 | `travel` | `templates/旅遊範本.md` |
| 陽台 | 日常 | `daily` | `templates/日常範本.md` |
| 閣樓 | 私人檔案 | 改 `me.md` | |

## 第一次設定（只要做一次）

1. **Settings → Secrets and variables → Actions → New repository secret**：Name 填 `SITE_PASSWORD`，Secret 填密碼
2. **Settings → Pages**：Source 選 **GitHub Actions**

## 新增文章（直接在 GitHub 網頁上）

1. 進到對應的資料夾（例如 `food`），按 **Add file → Create new file**
2. 檔名用「日期-英文代稱.md」，例如 `2026-11-03-beef-soup.md`。日期就是文章日期，英文代稱會變成網址
3. 把範本內容貼上、修改，按 **Commit changes**，大約一分鐘後網站就會更新

## 常用欄位

| 欄位 | 用途 |
| --- | --- |
| `title` | 標題 |
| `description` | 摘要，可省略 |
| `tags` | 標籤。書房的筆記寫科目名稱（AI、電子電路、Omniverse、PMP、管理、碳淨零、資料與雲端、英文、日文、論文）就會出現在那一科 |
| `cover` | 封面照片，例如 `/assets/img/beef.jpg`，可省略 |
| `place` | 地點（食記、旅遊） |
| `rating` | 星星 1～5（食記） |
| `price` | 價位（食記） |
| `days` | 天數（旅遊） |
| `lock: true` | 整篇上鎖，要密碼才能看 |
| `draft: true` | 草稿，不發布 |
| `updated: 2026-11-15` | 修改日期 |

## 只隱藏一部分

文章裡想藏起來的段落，用 `::: secret` 和 `:::` 包起來：

```markdown
這段大家都看得到。

::: secret
這段要密碼才看得到。
:::
```

科目頁和閣樓也需要密碼。同一台裝置輸入一次，其他上鎖的地方會一起打開。

**注意：這個 repo 是公開的，.md 原稿在 GitHub 上任何人都看得到。密碼只保護「網站」上的內容。** 真正私密的資料不要放上來，或把 repo 改成私人（需要 GitHub Pro）。

## 照片

上傳到 `assets/img/`，文章裡寫 `![說明](/assets/img/檔名.jpg)`，封面就填 `cover: /assets/img/檔名.jpg`。

## 想改網站名稱、自我介紹、大頭照

改 `_data/site.js`。房間名稱在 `_data/rooms.js`。顏色在 `assets/css/main.css` 最上面。

## 在自己電腦上預覽（可選）

```bash
npm install
SITE_PASSWORD=你的密碼 npm start
```

// 網站基本資料：想改名稱、介紹文字，改這裡就好
export default {
  title: "菜菜的小屋",
  author: "菜菜",
  description: "菜菜的小屋：學習筆記、食記、旅遊和日常，歡迎進來坐坐。",

  // 首頁大字
  welcome: "歡迎來我家坐坐",

  // 大頭照：把照片上傳到 assets/img/，這裡填 "/assets/img/檔名.jpg"；留空會顯示植物插圖
  avatar: "",

  // 自我介紹（首頁與客廳）
  tagline: "我是菜菜。白天學 AI、電路、專案管理和日文，有空就去找好吃的、往外面跑。這間小屋放我的筆記、食記和旅行，隨意參觀，上鎖的房間除外。",

  // 網址由 GitHub 部署時自動帶入，不用手動改
  url: (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, ""),
};

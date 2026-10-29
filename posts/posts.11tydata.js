// 書房：學習筆記
export default {
  layout: "layouts/post.njk",
  room: "study",
  eleventyComputed: {
    // draft: true 不發布；lock: true 整篇要密碼
    permalink: (data) => (data.draft ? false : `/posts/${data.page.fileSlug}/`),
    locked: (data) => data.lock === true,
  },
};

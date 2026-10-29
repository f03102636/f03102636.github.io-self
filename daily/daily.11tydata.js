// 這個資料夾的每一篇共用設定
export default {
  layout: "layouts/post.njk",
  room: "balcony",
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `/daily/${data.page.fileSlug}/`),
    locked: (data) => data.lock === true,
  },
};

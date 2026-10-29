// 這個資料夾的每一篇共用設定
export default {
  layout: "layouts/post.njk",
  room: "kitchen",
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `/food/${data.page.fileSlug}/`),
    locked: (data) => data.lock === true,
  },
};

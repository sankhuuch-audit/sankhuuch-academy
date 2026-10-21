import { slugify } from "../../../eleventy.config.js";

const PREVIEW = process.env.PREVIEW_DRAFTS === "1";

export default {
  layout: "layouts/course.njk",
  eleventyComputed: {
    // Хаягийн нэр: slug талбар эсвэл сургалтын нэрээс
    courseKey: (data) => slugify(data.slug || data.title),
    // Ноорог (draft) сургалтыг сайт дээр гаргахгүй
    permalink: (data) => {
      if (data.draft && !PREVIEW) return false;
      return `/surgaltuud/${slugify(data.slug || data.title)}/`;
    }
  }
};

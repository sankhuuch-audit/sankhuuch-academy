// Eleventy тохиргоо: Санхүүч-Аудит Академи (academy.sankhuuch-audit.mn)
// Агуулгыг src/content/courses (сургалтууд) болон src/_data (тохиргоо) хавтсаас засна.

import { HtmlBasePlugin } from "@11ty/eleventy";

const PREVIEW = process.env.PREVIEW_DRAFTS === "1";

const MN_MONTHS = [
  "1 дүгээр сар", "2 дугаар сар", "3 дугаар сар", "4 дүгээр сар", "5 дугаар сар", "6 дугаар сар",
  "7 дугаар сар", "8 дугаар сар", "9 дүгээр сар", "10 дугаар сар", "11 дүгээр сар", "12 дугаар сар"
];

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u",
  ү: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "i", э: "e",
  ю: "yu", я: "ya"
};

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "surgalt";
}

function toISODate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10);
}

function mnDate(value) {
  const iso = toISODate(value);
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${y} оны ${MN_MONTHS[m - 1]}ын ${d}`;
}

export function youtubeId(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return "";
}

const isPublished = (item) => PREVIEW || !item.data.draft;

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  for (const f of ["favicon.ico", "favicon.png", "favicon.svg", "favicon-192.png", "favicon-96.png"]) {
    eleventyConfig.addPassthroughCopy({ [`src/${f}`]: f });
  }
  eleventyConfig.addWatchTarget("src/assets/");

  // Сургалтууд: дарааллаар (order), дараа нь нэрээр
  eleventyConfig.addCollection("courses", (api) =>
    api.getFilteredByGlob("src/content/courses/*.md")
      .filter(isPublished)
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || String(a.data.title).localeCompare(String(b.data.title)))
  );

  eleventyConfig.addFilter("mnDate", mnDate);
  eleventyConfig.addFilter("isoDate", toISODate);
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addFilter("youtubeId", youtubeId);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("gaId", (v) => { const id = String(v || "").trim().toUpperCase(); return /^G-[A-Z0-9]{4,20}$/.test(id) ? id : ""; });
  eleventyConfig.addFilter("limit", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));
  eleventyConfig.addFilter("findBy", (arr, key, value) => (arr || []).find((x) => x && x[key] === value));
  eleventyConfig.addFilter("whereData", (arr, key, value) => (arr || []).filter((i) => i.data && i.data[key] === value));
  eleventyConfig.addFilter("whereDataNot", (arr, key, value) => (arr || []).filter((i) => i.data && i.data[key] !== value));
  eleventyConfig.addFilter("absUrl", (path, base) => {
    try { return new URL(path, base).href; } catch { return path; }
  });
  eleventyConfig.addFilter("telHref", (phone) => "tel:" + String(phone).replace(/[^\d+]/g, ""));
  // 150000 → 150,000₮
  eleventyConfig.addFilter("money", (n) => {
    const v = Number(n);
    return isFinite(v) && v > 0 ? Math.round(v).toLocaleString("en-US") + "₮" : "";
  });
  eleventyConfig.addFilter("courseSlug", (data) => slugify(data.slug || data.title));
  // Бүртгэлийн маягтад зориулсан сургалтын жагсаалт (<script type="application/json"> дотор)
  eleventyConfig.addFilter("courseIndex", (items) =>
    JSON.stringify((items || []).map((c) => ({
      key: c.data.courseKey || slugify(c.data.slug || c.data.title),
      title: c.data.title,
      status: c.data.status || "open"
    }))).replace(/</g, "\\u003c")
  );

  eleventyConfig.addGlobalData("build", () => ({
    year: new Date().getFullYear(),
    date: new Date().toISOString(),
    preview: PREVIEW
  }));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk"
  };
}

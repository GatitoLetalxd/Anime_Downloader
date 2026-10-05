const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("node:url");
const { ApiError } = require("../utils/api-error");
const MemoryCache = require("../utils/cache");

const DEFAULT_DOMAIN = "tvanime.tv";

const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

async function fetchHtml(url) {
  try {
    const timeout = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
    const response = await axios.get(url, {
      timeout,
      headers: HTTP_HEADERS,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.data;
  } catch (error) {
    throw new ApiError(500, "No se pudo obtener contenido desde TVAnime", error.message);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeToken(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * TVAnime marks language as "SUB", "LAT" or "CAST".
 * Map LAT/CAST → DUB, anything else → SUB.
 */
function normalizeVariantKey(lang) {
  const upper = (lang || "").toUpperCase().trim();
  if (upper === "LAT" || upper === "CAST" || upper === "DUB") return "DUB";
  return "SUB";
}

function slugFromUrl(urlCandidate) {
  try {
    const segments = new URL(urlCandidate).pathname.split("/").filter(Boolean);
    // /anime/{slug} → segments[1]
    // /anime/{slug}/episodio/episodio-N → segments[1]
    if (segments[0] === "anime") return segments[1] || null;
    return null;
  } catch (_) {
    return null;
  }
}

function episodeNumberFromUrl(urlCandidate) {
  try {
    const segments = new URL(urlCandidate).pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";
    // Expect format "episodio-N"
    const match = last.match(/(\d+)$/);
    return match ? Number(match[1]) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Build a canonical episode URL for TVAnime.
 * Format: https://tvanime.tv/anime/{slug}/episodio/episodio-{number}
 */
function buildEpisodeUrl(slug, number, domain = DEFAULT_DOMAIN) {
  return `https://${domain}/anime/${slug}/episodio/episodio-${number}`;
}

/**
 * Parse the server buttons from an episode page.
 * Each server button has:
 *   data-server-url   → embed URL
 *   data-server-name  → server name
 *   data-server-language → "SUB" | "LAT" | "CAST"
 */
function parseServerButtons(html) {
  const $ = cheerio.load(html);
  const streamLinks = { SUB: [], DUB: [] };

  $("button.watch-server").each((_, el) => {
    const btn = $(el);
    const url = btn.attr("data-server-url") || "";
    const name = btn.attr("data-server-name") || "Unknown";
    const lang = btn.attr("data-server-language") || "SUB";

    if (!url) return;

    const variant = normalizeVariantKey(lang);
    const token = normalizeToken(name);

    // Avoid duplicates
    const alreadyAdded = streamLinks[variant].some((l) => l.url === url);
    if (!alreadyAdded) {
      streamLinks[variant].push({ server: name, token, url, quality: null });
    }
  });

  return streamLinks;
}

/**
 * Preferred server order for online playback (iframe friendly).
 * Lower index = higher priority.
 */
const SERVER_PRIORITY = [
  "mp4upload",
  "voe",
  "mega",
  "upnshare",
  "mixdrop",
  "doodstream",
  "streamwish",
  "filemoon",
  "hls",
];

function sortServersByPriority(links) {
  return [...links].sort((a, b) => {
    const ta = normalizeToken(a.server);
    const tb = normalizeToken(b.server);
    const ia = SERVER_PRIORITY.findIndex((p) => ta.includes(p));
    const ib = SERVER_PRIORITY.findIndex((p) => tb.includes(p));
    const ra = ia === -1 ? SERVER_PRIORITY.length : ia;
    const rb = ib === -1 ? SERVER_PRIORITY.length : ib;
    return ra - rb;
  });
}

// ─── Anime info helpers ─────────────────────────────────────────────────────────

function parseAnimeInfo($) {
  const title =
    $("h1.anime-title, h1.tvh-anime-title, h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content") ||
    null;

  const description =
    $(".anime-synopsis p, .anime-synopsis, .tvh-anime-synopsis p, .tvh-anime-synopsis").first().text().trim() ||
    $("meta[name='description']").attr("content") ||
    null;

  const image =
    $(".anime-poster img").attr("src") ||
    $(".anime-poster img").attr("data-src") ||
    $(".tvh-anime-cover img").attr("src") ||
    $(".anime-cover img").attr("src") ||
    $("[class*='poster'] img, [class*='cover'] img").first().attr("src") ||
    $("meta[property='og:image']").attr("content") ||
    null;

  const backdrop =
    $("img.anime-hero-backdrop").attr("src") ||
    $("img.anime-hero-backdrop").attr("data-src") ||
    null;

  const status =
    $(".anime-status, .tvh-anime-status .tvh-field-value, [class*='status']").first().text().trim() || null;

  const type =
    $(".anime-meta, .tvh-anime-type .tvh-field-value, [class*='type']").first().text().trim() || null;

  const year =
    $(".tvh-anime-year .tvh-field-value, [class*='year']").first().text().trim() || null;

  const score =
    $(".anime-stats, .tvh-anime-score .tvh-field-value, [class*='score']").first().text().trim() || null;

  const genres = [];
  $(".anime-genres a, a[href*='/genero/'], a[href*='/genre/']").each((_, el) => {
    const name = $(el).text().trim();
    if (name && !genres.some((g) => g.name === name)) {
      genres.push({
        id: null,
        name,
        slug: normalizeToken(name),
        malId: null,
      });
    }
  });

  return { title, description, image, backdrop, status, type, year: year ? Number(year) || null : null, score, genres };
}

function parseEpisodeList($, slug, domain = DEFAULT_DOMAIN) {
  const episodes = [];
  const seen = new Set();

  $("a[href*='/episodio/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const epMatch = href.match(/episodio-(\d+)/);
    if (!epMatch) return;

    const number = Number(epMatch[1]);
    if (seen.has(number)) return;
    seen.add(number);

    episodes.push({
      id: null,
      number,
      title: `Episodio ${number}`,
      url: buildEpisodeUrl(slug, number, domain),
    });
  });

  return episodes.sort((a, b) => a.number - b.number);
}

// ─── Public API ────────────────────────────────────────────────────────────────

async function searchAnime(query, domainCandidate) {
  const cleanQuery = (query || "").toString().trim();
  if (!cleanQuery) {
    throw new ApiError(400, "Se requiere el parametro q");
  }

  const cacheKey = `tvanime:search:${cleanQuery}:${domainCandidate || ""}`;
  const cached = MemoryCache.get(cacheKey);
  if (cached) return cached;

  const domain = (domainCandidate || DEFAULT_DOMAIN).toString().trim();
  const searchUrl = `https://${domain}/directorio?q=${encodeURIComponent(cleanQuery)}`;

  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);

  const results = [];

  // TVAnime renders two <a> per card:
  //   1. article.anime-card-image > a  (contains the cover image, text = type label)
  //   2. div > h2 > a                  (contains the real title text)
  // We pick the title from h2 > a and the cover image from the sibling article.
  $("h2 > a[href*='/anime/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("/episodio/")) return;

    let absUrl;
    try {
      absUrl = new URL(href, `https://${domain}`).toString();
    } catch (_) {
      return;
    }

    const slug = slugFromUrl(absUrl);
    if (!slug) return;

    const title = $(el).text().trim();
    if (!title) return;

    if (results.some((r) => r.url === absUrl)) return;

    // Card container contains the cover image
    const card = $(el).closest(".anime-card, article");
    const imgEl = card.find("img").first();
    const imageRaw = imgEl.attr("src") || imgEl.attr("data-src") || null;
    const image = imageRaw
      ? imageRaw.startsWith("http")
        ? imageRaw
        : `https://${domain}${imageRaw}`
      : null;

    const typeText =
      card.find(".anime-card-type, [class*='type']").first().text().trim() || "Anime";

    results.push({
      id: null,
      title,
      slug,
      url: absUrl,
      image,
      backdrop: null,
      type: typeText || "Anime",
      score: null,
      status: null,
      year: null,
    });
  });

  const result = {
    success: true,
    data: { query: cleanQuery, results, count: results.length },
    source: "tvanime",
  };
  MemoryCache.set(cacheKey, result, 3 * 60 * 1000);
  return result;
}

async function getAnimeInfo(urlCandidate) {
  const slug = slugFromUrl(urlCandidate);
  if (!slug) throw new ApiError(400, "URL inválida – no se pudo extraer el slug");

  const cacheKey = `tvanime:info:${slug}`;
  const cached = MemoryCache.get(cacheKey);
  if (cached) return cached;

  const domain = DEFAULT_DOMAIN;
  const animeUrl = `https://${domain}/anime/${slug}`;
  const html = await fetchHtml(animeUrl);
  const $ = cheerio.load(html);

  const info = parseAnimeInfo($);
  const episodes = parseEpisodeList($, slug, domain);

  const result = {
    success: true,
    data: {
      id: null,
      title: info.title,
      titleJapanese: null,
      description: info.description,
      image: info.image,
      backdrop: info.backdrop,
      status: info.status,
      type: info.type,
      year: info.year,
      startDate: null,
      endDate: null,
      score: info.score ? Number(info.score) || null : null,
      votes: null,
      totalEpisodes: episodes.length,
      malId: null,
      trailer: null,
      genres: info.genres,
      episodes,
    },
    source: "tvanime",
  };
  MemoryCache.set(cacheKey, result, 10 * 60 * 1000);
  return result;
}

async function getEpisodeLinks(urlCandidate) {
  const slug = slugFromUrl(urlCandidate);
  const episodeNumber = episodeNumberFromUrl(urlCandidate);

  if (!slug || episodeNumber === null) {
    throw new ApiError(400, "URL inválida – no se pudo extraer slug y número de episodio");
  }

  const cacheKey = `tvanime:episode:${slug}:${episodeNumber}`;
  const cached = MemoryCache.get(cacheKey);
  if (cached) return cached;

  const episodeUrl = buildEpisodeUrl(slug, episodeNumber);
  const html = await fetchHtml(episodeUrl);

  const rawLinks = parseServerButtons(html);

  // Sort by priority for best playback experience
  const subSorted = sortServersByPriority(rawLinks.SUB);
  const dubSorted = sortServersByPriority(rawLinks.DUB);

  const episodeTitle =
    cheerio.load(html)("h1, h2").first().text().trim() || `Episodio ${episodeNumber}`;

  const toServerRecord = (l) => ({ server: l.server, url: l.url });

  const result = {
    success: true,
    data: {
      id: null,
      episode: episodeNumber,
      title: episodeTitle,
      season: null,
      variants: {
        SUB: subSorted.length > 0 ? 1 : 0,
        DUB: dubSorted.length > 0 ? 1 : 0,
      },
      publishedAt: null,
      servers: {
        sub: subSorted.map(toServerRecord),
        dub: dubSorted.map(toServerRecord),
      },
      streamLinks: {
        SUB: subSorted.map(toServerRecord),
        DUB: dubSorted.map(toServerRecord),
      },
      downloadLinks: {
        SUB: [],
        DUB: [],
      },
    },
    source: "tvanime",
  };
  MemoryCache.set(cacheKey, result, 10 * 60 * 1000);
  return result;
}

async function getRecommendations(domainCandidate) {
  const domain = (domainCandidate || DEFAULT_DOMAIN).toString().trim();
  const cacheKey = `tvanime:recommendations:${domain}`;
  const cached = MemoryCache.get(cacheKey);
  if (cached) return cached;

  const html = await fetchHtml(`https://${domain}/directorio`);
  const $ = cheerio.load(html);

  const results = [];
  const seen = new Set();

  $("h2.anime-card-title > a[href*='/anime/'], h2 > a[href*='/anime/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("/episodio/")) return;

    let absUrl;
    try {
      absUrl = new URL(href, `https://${domain}`).toString();
    } catch (_) {
      return;
    }

    const slug = slugFromUrl(absUrl);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title = $(el).text().trim();
    if (!title) return;

    const card = $(el).closest(".anime-card, article");
    const imgEl = card.find("img").first();
    const imageRaw = imgEl.attr("src") || imgEl.attr("data-src") || null;
    const image = imageRaw
      ? imageRaw.startsWith("http")
        ? imageRaw
        : `https://${domain}${imageRaw}`
      : null;

    results.push({
      id: null,
      title,
      slug,
      url: absUrl,
      image,
      backdrop: null,
      type: "Anime",
      score: null,
      status: null,
      year: null,
    });
  });

  const result = {
    success: true,
    data: { results, count: results.length },
    source: "tvanime",
  };
  MemoryCache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

module.exports = {
  searchAnime,
  getAnimeInfo,
  getEpisodeLinks,
  getRecommendations,
};

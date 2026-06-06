const { URL } = require("node:url");
const { ApiError } = require("../utils/api-error");
const animeav1Service = require("./animeav1.service");
const jkanimeService = require("./jkanime.service");
const animeflvService = require("./animeflv.service");
const hentailaService = require("./hentaila.service");
const tioanimeService = require("./tioanime.service");
const monoschinosService = require("./monoschinos.service");

const DEFAULT_ANIME_DOMAIN = process.env.DEFAULT_ANIME_DOMAIN || "animeav1.com";

const PROVIDERS = [
  {
    id: "animeav1",
    label: "AnimeAV1",
    domains: [DEFAULT_ANIME_DOMAIN, "animeav1.com", "www.animeav1.com"],
    service: animeav1Service,
  },
  {
    id: "jkanime",
    label: "JKAnime",
    domains: ["jkanime.net", "www.jkanime.net"],
    service: jkanimeService,
  },
  {
    id: "animeflv",
    label: "AnimeFLV",
    domains: ["animeflv.net", "www.animeflv.net", "www4.animeflv.net"],
    service: animeflvService,
  },
  {
    id: "hentaila",
    label: "HentaiLA",
    domains: ["hentaila.com", "www.hentaila.com"],
    service: hentailaService,
  },
  {
    id: "tioanime",
    label: "TioAnime",
    domains: ["tioanime.com", "www.tioanime.com"],
    service: tioanimeService,
  },
  {
    id: "monoschinos",
    label: "MonosChinos",
    domains: ["monoschinos2.com", "www.monoschinos2.com"],
    service: monoschinosService,
  },
];

function normalizeDomain(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).hostname.toLowerCase();
    }
    return new URL(`https://${trimmed}`).hostname.toLowerCase();
  } catch (_error) {
    return trimmed.split("/")[0];
  }
}

function domainMatches(domain, candidate) {
  if (!domain || !candidate) {
    return false;
  }

  if (domain === candidate) {
    return true;
  }

  return domain.endsWith(`.${candidate}`);
}

function findProviderByDomain(domainCandidate) {
  const domain = normalizeDomain(domainCandidate);
  if (!domain) {
    return null;
  }

  return (
    PROVIDERS.find((provider) => provider.domains.some((candidate) => domainMatches(domain, candidate))) || null
  );
}

function findProviderById(providerId) {
  if (!providerId || typeof providerId !== "string") {
    return null;
  }

  const normalized = providerId.trim().toLowerCase();
  return PROVIDERS.find((provider) => provider.id === normalized) || null;
}

function findProviderForUrl(urlCandidate) {
  if (!urlCandidate || typeof urlCandidate !== "string") {
    return null;
  }

  try {
    const host = new URL(urlCandidate).hostname;
    return findProviderByDomain(host);
  } catch (_error) {
    return null;
  }
}

async function searchAnime(query, domainCandidate, genre) {
  const cleanQuery = (query || "").toString().trim();
  const cleanGenre = (genre || "").toString().trim();
  
  const forcedProvider = findProviderByDomain(domainCandidate) || findProviderById(domainCandidate);
  
  // If domainCandidate is "all" or not provided, perform search in parallel
  if (!domainCandidate || domainCandidate === "all") {
    // Only query active providers that support search
    const activeProviders = PROVIDERS.filter(p => p.id === "animeav1" || p.id === "animeflv" || p.id === "tioanime");
    const searchPromises = activeProviders.map(async (provider) => {
      try {
        const res = await provider.service.searchAnime(cleanQuery, provider.domains[0], cleanGenre);
        return { providerId: provider.id, results: res?.data?.results || [] };
      } catch (err) {
        console.error(`Search failed for provider ${provider.id}:`, err.message);
        return { providerId: provider.id, results: [], error: err.message };
      }
    });

    const outcomes = await Promise.all(searchPromises);
    const mergedResults = [];
    const seenTitles = new Set();

    for (const outcome of outcomes) {
      for (const item of outcome.results) {
        const normTitle = (item.title || "").toLowerCase().trim();
        if (normTitle && !seenTitles.has(normTitle)) {
          seenTitles.add(normTitle);
          mergedResults.push({
            ...item,
            source: outcome.providerId,
          });
        }
      }
    }

    return {
      success: true,
      data: {
        query: cleanQuery,
        genre: cleanGenre,
        results: mergedResults,
        count: mergedResults.length,
      },
      source: "all",
    };
  }

  // Single provider search
  const provider = forcedProvider || PROVIDERS[0];
  const result = await provider.service.searchAnime(cleanQuery, provider.domains[0], cleanGenre);
  return {
    ...result,
    source: result?.source || provider.id,
  };
}

async function getAnimeInfo(urlCandidate) {
  const provider = findProviderForUrl(urlCandidate) || PROVIDERS[0];
  if (!provider) {
    throw new ApiError(400, "Proveedor no soportado");
  }

  const result = await provider.service.getAnimeInfo(urlCandidate);
  return {
    ...result,
    source: result?.source || provider.id,
  };
}

async function getEpisodeLinks(urlCandidate, includeMega, excludeServers) {
  const provider = findProviderForUrl(urlCandidate) || PROVIDERS[0];
  if (!provider) {
    throw new ApiError(400, "Proveedor no soportado");
  }

  const result = await provider.service.getEpisodeLinks(urlCandidate, includeMega, excludeServers);
  return {
    ...result,
    source: result?.source || provider.id,
  };
}

async function getRecommendations(domainCandidate) {
  const provider = findProviderByDomain(domainCandidate) || findProviderById(domainCandidate) || PROVIDERS[0];
  if (provider && provider.service.getRecommendations) {
    try {
      const res = await provider.service.getRecommendations(provider.domains[0]);
      return {
        ...res,
        source: res?.source || provider.id,
      };
    } catch (err) {
      console.error(`Failed to get recommendations for provider ${provider.id}:`, err);
    }
  }

  // Fallback to first provider that supports recommendations
  for (const p of PROVIDERS) {
    if (p.service.getRecommendations && p.id !== provider.id) {
      try {
        const res = await p.service.getRecommendations(p.domains[0]);
        return {
          ...res,
          source: res?.source || p.id,
        };
      } catch (err) {
        console.error(`Failed fallback recommendations for provider ${p.id}:`, err);
      }
    }
  }

  throw new ApiError(501, "No se pudieron obtener recomendaciones");
}

function getGenres() {
  return {
    success: true,
    data: [
      { name: "Acción", slug: "accion" },
      { name: "Aventura", slug: "aventura" },
      { name: "Comedia", slug: "comedia" },
      { name: "Drama", slug: "drama" },
      { name: "Ecchi", slug: "ecchi" },
      { name: "Fantasía", slug: "fantasia" },
      { name: "Magia", slug: "magia" },
      { name: "Misterio", slug: "misterio" },
      { name: "Psicológico", slug: "psicologico" },
      { name: "Romance", slug: "romance" },
      { name: "Ciencia Ficción", slug: "ciencia-ficcion" },
      { name: "Seinen", slug: "seinen" },
      { name: "Shoujo", slug: "shoujo" },
      { name: "Shounen", slug: "shounen" },
      { name: "Sobrenatural", slug: "sobrenatural" },
      { name: "Suspenso", slug: "suspenso" },
      { name: "Terror", slug: "terror" },
      { name: "Isekai", slug: "isekai" },
      { name: "Hentai +18 (HentaiLA)", slug: "hentaila" }
    ]
  };
}

module.exports = {
  searchAnime,
  getAnimeInfo,
  getEpisodeLinks,
  getRecommendations,
  getGenres,
};

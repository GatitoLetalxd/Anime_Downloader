const express = require("express");
const axios = require("axios");
const { requireApiKey } = require("../middlewares/auth");
const { dailyRateLimit } = require("../middlewares/rate-limit");
const animeService = require("../services/anime.service");
const downloadService = require("../services/download.service");
const { ApiError } = require("../utils/api-error");

const router = express.Router();

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// Image proxy — no API key required, fetches images server-side bypassing hotlinking
router.get(
  "/image-proxy",
  asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      throw new ApiError(400, "Se requiere el parámetro url");
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_e) {
      throw new ApiError(400, "URL inválida");
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new ApiError(400, "Protocolo no permitido");
    }

    try {
      const response = await axios.get(url, {
        responseType: "stream",
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: `${parsedUrl.origin}/`,
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });

      const contentType = response.headers["content-type"] || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      response.data.pipe(res);
    } catch (err) {
      throw new ApiError(502, "No se pudo obtener la imagen");
    }
  })
);

router.use(requireApiKey, dailyRateLimit);

router.get(
  "/recommendations",
  asyncHandler(async (req, res) => {
    const response = await animeService.getRecommendations(req.query.domain);
    res.status(200).json(response);
  })
);

router.get(
  "/genres",
  asyncHandler(async (req, res) => {
    const response = await animeService.getGenres();
    res.status(200).json(response);
  })
);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const response = await animeService.searchAnime(req.query.q, req.query.domain, req.query.genre);
    res.status(200).json(response);
  })
);

router.get(
  "/info",
  asyncHandler(async (req, res) => {
    if (!req.query.url) {
      throw new ApiError(400, "Se requiere el parametro url");
    }

    const response = await animeService.getAnimeInfo(req.query.url);
    res.status(200).json(response);
  })
);

router.get(
  "/episode",
  asyncHandler(async (req, res) => {
    if (!req.query.url) {
      throw new ApiError(400, "Se requiere el parametro url");
    }

    const response = await animeService.getEpisodeLinks(req.query.url, req.query.includeMega, req.query.excludeServers);
    res.status(200).json(response);
  })
);

router.post(
  "/download",
  asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = downloadService.createDownload(req.body || {}, baseUrl);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

router.get(
  "/download/:id",
  asyncHandler(async (req, res) => {
    const data = downloadService.getDownload(req.params.id);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

router.post(
  "/batch-download",
  asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = downloadService.createBatch(req.body || {}, baseUrl);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

router.get(
  "/batch/:id",
  asyncHandler(async (req, res) => {
    const data = downloadService.getBatch(req.params.id);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

module.exports = router;

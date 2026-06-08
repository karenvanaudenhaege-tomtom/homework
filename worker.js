/**
 * Cloudflare Worker — Google Translate TTS proxy
 *
 * Fetches audio from Google Translate TTS and returns it with CORS headers
 * so the browser on GitHub Pages can play it.
 *
 * Only responds to requests from your GitHub Pages domain or local http:// origins.
 *
 * Deploy: paste this file into the Cloudflare Worker editor and save.
 *
 * Usage: GET /?word=hello&lang=en   or  /?word=keel&lang=af
 */

const ALLOWED_HTTPS_ORIGINS = new Set([
  "https://karenvanaudenhaege-tomtom.github.io",
]);

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";

    const isLocal = origin.startsWith("http://");
    const isAllowed = isLocal || ALLOWED_HTTPS_ORIGINS.has(origin) || origin.endsWith(".pages.dev");

    if (!isAllowed) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const word = searchParams.get("word");
    const lang = searchParams.get("lang");

    if (!word || !lang) {
      return new Response("Missing word or lang", { status: 400 });
    }

    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
      return new Response("Invalid lang", { status: 400 });
    }

    const ttsUrl =
      `https://translate.googleapis.com/translate_tts` +
      `?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${encodeURIComponent(lang)}&client=gtx`;

    const upstream = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok) {
      return new Response("Upstream TTS error", { status: upstream.status });
    }

    return new Response(await upstream.arrayBuffer(), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": origin,
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
};

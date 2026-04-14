/**
 * Cloudflare Worker — Google Translate TTS proxy
 *
 * Fetches audio from Google Translate TTS without sending a Referer header,
 * which is what GitHub Pages blocks. Returns the audio with CORS headers so
 * the browser on any origin can play it.
 *
 * Only responds to requests from your GitHub Pages domain or local http:// origins (local network only).
 *
 * Deploy steps (Cloudflare dashboard — no CLI needed):
 *   1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create
 *   2. "Create Worker" → paste this file → Save and deploy
 *   3. Copy the worker URL (e.g. https://tts-proxy.YOUR-NAME.workers.dev)
 *   4. Paste it into index.html where it says TTS_WORKER_URL
 *
 * Usage: GET /?word=hello&lang=en   or  /?word=huis&lang=af
 */

// Allowed HTTPS origins (public internet).
// Local http:// origins are always allowed — they're only reachable on your own network.
const ALLOWED_HTTPS_ORIGINS = new Set([
  "https://karenvanaudenhaege-tomtom.github.io",
]);

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";

    const isLocal = origin.startsWith("http://");
    const isAllowed = isLocal || ALLOWED_HTTPS_ORIGINS.has(origin);

    if (!isAllowed) {
      return new Response("Forbidden", { status: 403 });
    }

    // CORS preflight
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

    // Whitelist safe language codes only (e.g. "en", "af", "fr-CA")
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
      return new Response("Invalid lang", { status: 400 });
    }

    const ttsUrl =
      `https://translate.googleapis.com/translate_tts` +
      `?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${encodeURIComponent(lang)}&client=gtx`;

    const upstream = await fetch(ttsUrl, {
      headers: {
        // Mimic a plain browser request — no Referer header sent
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok) {
      return new Response("Upstream TTS error", { status: upstream.status });
    }

    const audio = await upstream.arrayBuffer();

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": origin,
        // Cache for 24 h — single words never change
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
};

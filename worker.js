/**
 * Cloudflare Worker — TTS proxy
 *
 * Afrikaans: ElevenLabs multilingual_v2 (high quality)
 * All other languages: Google Translate TTS
 *
 * Deploy steps (Cloudflare dashboard — no CLI needed):
 *   1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create
 *   2. "Create Worker" → paste this file → Save and deploy
 *   3. Settings → Environment Variables → add ELEVENLABS_API_KEY (secret)
 *      Optionally add ELEVENLABS_VOICE_ID to override the default voice.
 *      Find Afrikaans voices at https://elevenlabs.io/voice-library
 *
 * Usage: GET /?word=hello&lang=en   or  /?word=huis&lang=af
 */

// Allowed HTTPS origins (public internet).
// Local http:// origins are always allowed — they're only reachable on your own network.
const ALLOWED_HTTPS_ORIGINS = new Set([
  "https://karenvanaudenhaege-tomtom.github.io",
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    const isLocal = origin.startsWith("http://");
    const isAllowed = isLocal || ALLOWED_HTTPS_ORIGINS.has(origin) || origin.endsWith(".pages.dev");

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

    // Afrikaans → ElevenLabs (much better pronunciation than Google Translate)
    if (lang === "af" && env.ELEVENLABS_API_KEY) {
      const voiceId = env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: word,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
        }),
      });

      if (res.ok) {
        return new Response(await res.arrayBuffer(), {
          headers: {
            "Content-Type": "audio/mpeg",
            "Access-Control-Allow-Origin": origin,
            "Cache-Control": "no-store",
            "X-TTS-Provider": "elevenlabs",
          },
        });
      }
      // ElevenLabs failed — include status in header for debugging
      const errStatus = res.status;
      return new Response(await res.text(), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "X-TTS-Provider": "elevenlabs-failed",
          "X-ElevenLabs-Status": String(errStatus),
        },
      });
    }

    // Google Translate TTS (English and fallback)
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
        "X-TTS-Provider": "google",
      },
    });
  },
};

# Homework App — Project Notes

## Deploying to production

Before every push to `main`, bump the version number in `index.html` to bust the browser cache:

```html
<script src="words.js?v=XX"></script>
<script src="emoji-map.js?v=XX"></script>
```

Increment `XX` by 1 each time. After pushing, report the new version number to the user.

## When adding new words

After updating `words.js`, always do both of the following before committing:

**1. Check emoji coverage.** For every new word (English and Afrikaans), look it up in `emoji-map.js`. If it's missing, add a suitable emoji entry in the right semantic section. Use the `update-emojis` skill if available.

**2. Afrikaans audio is automatic.** The Cloudflare Worker calls ElevenLabs for Afrikaans words — no manual step needed. New words are spoken correctly as soon as the word list is live.

> One-time setup: in the Cloudflare Worker dashboard → Settings → Environment Variables, add `ELEVENLABS_API_KEY` (secret). Get the key from https://elevenlabs.io → Profile → API Keys (free account, 10k chars/month).

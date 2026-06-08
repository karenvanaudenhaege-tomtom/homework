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

**2. Generate Afrikaans audio.** Afrikaans words use pre-recorded MP3 files in `audio/af/`. Run the generation script for any new Afrikaans words before committing:

```bash
ELEVENLABS_API_KEY=your_key node generate-audio.js
```

The script skips words that already have an MP3. Commit the new `audio/af/*.mp3` files alongside `words.js`.

> First time: sign up free at https://elevenlabs.io, copy your API key from Profile → API Keys.

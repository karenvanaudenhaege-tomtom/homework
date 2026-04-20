# Update Emoji Map

Run this command after updating words.js to ensure every word has an emoji.

## Steps

1. Find missing words by running:
```bash
node -e "
const fs = require('fs');
let wSrc = fs.readFileSync('words.js','utf8').replace(/const /g,'var ');
let mSrc = fs.readFileSync('emoji-map.js','utf8').replace(/const /g,'var ');
eval(wSrc); eval(mSrc);
const all=[...WEEKLY_WORDS.english,...WEEKLY_WORDS.afrikaans];
const miss=all.filter(w=>!EMOJI_MAP[w.toLowerCase()]);
console.log(JSON.stringify(miss));
"
```

2. For each missing word, pick an appropriate emoji that a child would recognise and find fun. Consider the word's meaning in both English and Afrikaans context.

3. Add the missing entries to emoji-map.js. Each word should appear on its own line in the appropriate alphabetical section, following the existing pattern:
   `"word": "emoji",`

4. Run the check again to confirm zero missing words.

5. Report what was added — do NOT commit (the user will decide when to push).

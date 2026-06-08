#!/usr/bin/env node
// Downloads ElevenLabs TTS audio for every Afrikaans word in words.js
//
// Setup:
//   1. Sign up free at https://elevenlabs.io
//   2. Copy your API key from Profile → API Keys
//   3. (Optional) Find an Afrikaans voice at https://elevenlabs.io/voice-library
//      Search "afrikaans", copy the voice ID, set ELEVENLABS_VOICE_ID below
//
// Usage:
//   ELEVENLABS_API_KEY=your_key node generate-audio.js
//
// Output: audio/af/<word>.mp3  (skips files that already exist)
// After running: commit the audio/af/*.mp3 files before pushing to production.

const fs   = require('fs');
const path = require('path');

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel (multilingual)
const OUT_DIR  = path.join(__dirname, 'audio', 'af');

if (!API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY is not set.');
    console.error('Usage: ELEVENLABS_API_KEY=your_key node generate-audio.js');
    process.exit(1);
}

// Parse Afrikaans words from words.js
const src   = fs.readFileSync(path.join(__dirname, 'words.js'), 'utf8');
const block = src.match(/afrikaans:\s*\[([\s\S]*?)\]/);
if (!block) { console.error('Could not find afrikaans word list in words.js'); process.exit(1); }
const words = [...block[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);

fs.mkdirSync(OUT_DIR, { recursive: true });

async function generate(word) {
    const outFile = path.join(OUT_DIR, `${word}.mp3`);
    if (fs.existsSync(outFile)) {
        console.log(`  skip  "${word}"`);
        return;
    }
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method:  'POST',
        headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
            text:           word,
            model_id:       'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true }
        })
    });
    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`ElevenLabs ${res.status} for "${word}": ${msg}`);
    }
    fs.writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
    console.log(`  saved "${word}"`);
}

(async () => {
    console.log(`Generating audio for ${words.length} Afrikaans words (voice: ${VOICE_ID})...\n`);
    for (const word of words) {
        await generate(word);
    }
    console.log('\nDone. Commit audio/af/*.mp3 before pushing to production.');
})().catch(e => { console.error('\nError:', e.message); process.exit(1); });

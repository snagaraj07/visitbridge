# VisitBridge

[![CI](https://github.com/snagaraj07/visitbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/snagaraj07/visitbridge/actions/workflows/ci.yml)
[![CodeQL](https://github.com/snagaraj07/visitbridge/actions/workflows/codeql.yml/badge.svg)](https://github.com/snagaraj07/visitbridge/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live:** https://visitbridge.alavai.ai

IEEE Hack for Humanity 2026, Track 2: AI for Accessibility and Disability Inclusion.

VisitBridge makes a short animated story, told out loud, that shows an
autistic child exactly what will happen at a doctor visit, a dentist visit,
a haircut, or a daily routine like bath time or bedtime. A friend from the
child's favorite thing tells the story, so a kid who loves lawn mowers hears
Mo the Mower walk them through every step.

Not a diagnostic tool. Not medical advice.

## Why

For many autistic kids a check-up is a string of surprises: strangers, loud
rooms, a cuff that squeezes, something cold in their ear. Kids get held down,
visits get cut short, and families skip care. Daily routines can be just as
hard. Social stories and visual supports are proven ways to help, but making
one by hand for each visit takes a parent hours.

## What it does

- **Story for the exact visit or routine.** Doctor and dentist visits, shots,
  blood tests, haircuts, bath, bedtime, toilet, school and more.
- **Plans for what scares them.** The parent picks the hard parts (needles,
  loud sounds, being touched, waiting) or types them. The story gives the
  child a plan for that moment, from pediatric and autism care guidance.
- **Made for how the child listens.** Ages 3 to 5 get tiny sentences, an
  attention hook on each page, and repeated key words. A slow mode (🐢)
  slows the voice, the video and the page turns.
- **Looks like them.** The child in the pictures matches the skin, hair and
  glasses the parent picks. A photo of the child is never used.
- **40 languages,** with AI voices where available and the device voice
  otherwise. Words light up as they are read.
- **Honest about pain.** "A sharp poke. It hurts for 2 seconds." Never
  "it won't hurt" or "be brave".
- **Demos** for the hardest visits play from saved files, with no AI calls.

## Privacy and safety

- The child's profile and stories live in the browser only. No accounts, no
  database, nothing about the child is stored on the server.
- The child's name is never sent to the story AI. The model writes "NAME" and
  the browser fills it in.
- Phone numbers, emails, dates of birth, MRNs, addresses and patient names are
  removed before any text reaches a model (`src/scrub.js`).
- Every story has the comfort item, an "it's OK to feel worried" page and a
  happy ending. If the model leaves them out, the code adds them back.
- Pictures are gentle: no blood and no needles touching skin. Story friends
  are original characters, never from a show, movie or toy brand.
- Server logs never include request content.

See [SECURITY.md](SECURITY.md) for the security model and how to report a problem.

## How it works

| Part | Technology |
| --- | --- |
| Server | Cloudflare Workers (`src/`) |
| App | Plain HTML, CSS and JavaScript modules (`public/`), no build step |
| Story | Llama 3.3 70B on Workers AI |
| Pictures | Leonardo Lucid Origin on Workers AI |
| Voice | Deepgram Aura 2 and MeloTTS on Workers AI; ElevenLabs (optional) |
| Video | Kling 2.1 on fal.ai (optional) |

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run it

Needs Node.js 22.9 or newer.

```
npm ci
npm test
```

Create `.env` (never committed) using [.dev.vars.example](.dev.vars.example):

```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

```
npm run local     # http://localhost:8787
```

Without keys it falls back to a sample story. `npm run dev` uses wrangler
instead (needs macOS 13.5+). `npm run deploy` publishes to Cloudflare.
Production secrets are set with `wrangler secret put`, never in files.

## Layout

```
src/            Worker: routes, story prompt, pictures, voice, video, scrubbing
public/         The app, served as static files
public/demo/    Ready-made demo stories
public/_headers Security headers for every page
dev/            Local server and the demo maker
test/           Unit tests (node --test)
docs/           Architecture
.github/        CI, CodeQL, Dependabot, templates
```

## Sources

- CDC, 2025: 1 in 31 eight-year-olds identified as autistic.
- Marshall et al., Pediatric Dentistry 2008: tell-show-do among the most
  accepted approaches for autistic kids at the dentist.
- McKinney et al., Academic Pediatrics 2014: higher unmet dental need.
- NCAEP 2020: social narratives and visual supports are evidence-based
  practices for autistic children.

## License

[MIT](LICENSE). Project by Subramani Nagaraj.

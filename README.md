# VisitBridge

IEEE Hack for Humanity 2026
Track 2: AI for Accessibility and Disability Inclusion

Helps parents get their autistic kid through doctor and dentist visits.

For a lot of autistic kids a check-up is a string of surprises: strangers,
loud rooms, a cuff that squeezes, something cold in their ear. Kids get
held down, visits get cut short, and families skip care. Dental care is
the most commonly unmet need for these kids. VisitBridge helps the parent
prepare the child at home and hands the clinic staff what they need to know.

Not a diagnostic tool. Not medical advice.

## What it does

- **Visit story** - pick the visit (check-up, dental cleaning, shot, blood
  test, ear check, eye exam, X-ray, hearing test). The AI writes a social
  story for that visit in the child's voice, step by step, using what is
  hard for them and what helps. The parent can tell it through the
  child's favorite thing: pick "lawn mowers" and Mo the Mower comes along,
  and the toothbrush "sounds like a tiny lawn mower". The medical steps
  stay real; the theme only adds a friend and comparisons. Each page has one true, interesting detail
  or a small job for the child, and the real sound they will hear
  ("Bzzzz", "Beep!"). Pages play as animated scenes, and words light up as
  they are read aloud. Turn on "No movement" under Display for a still version. If a
  picture doesn't fit, the parent can pick another one or use their own
  photo of the real clinic or the child's teddy. Photos stay on the device.
  Print it as a booklet for the night before.
- **Demos** - ready-made stories for the hardest visits (haircut, dentist,
  shot, blood test) that play from saved files.

## Privacy and safety

- The child's profile lives in localStorage only. No accounts, nothing
  stored on the server.
- The child's name is never sent. The model writes "NAME" in the title and
  the browser fills it in.
- Phone numbers, emails, DOB, MRN, addresses and "Patient:" names are
  stripped before any text goes to the model (`src/scrub.js`).
- The model can only pick pictures from a fixed list. No generated images.
- Every story has the comfort item, an "it's OK to feel worried" page and
  a clear ending. If the model leaves them out, the code adds them back.
- Stories are honest about pain ("hurts for about 2 seconds") and avoid
  words like "pinch", "quick" and "brave".
- Model: Llama 3.3 70B on Cloudflare Workers AI.

## Run it

```
npm install
npm test
```

Put `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in a `.env` file, then:

```
npm run local     # http://localhost:8787
```

Without keys it falls back to a sample story. `npm run dev` uses wrangler
instead (needs macOS 13.5+). `npm run deploy` pushes to Cloudflare.

## Layout

```
src/        worker: routes, story prompt, scrubbing
public/     the app (plain HTML, CSS, JS modules, no build step)
dev/        local server for machines that can't run workerd
test/       node --test
```

## Sources

- CDC, 2025: 1 in 31 eight-year-olds identified as autistic.
- Marshall et al., Pediatric Dentistry 2008: tell-show-do among the most
  accepted approaches for autistic kids at the dentist.
- McKinney et al., Academic Pediatrics 2014: higher unmet dental need.
- NCAEP 2020: social narratives and visual supports are evidence-based
  practices for autistic children.

## License

MIT - Subramani Nagaraj

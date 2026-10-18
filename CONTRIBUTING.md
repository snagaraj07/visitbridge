# Contributing

Thank you for helping families with autistic kids. Ideas from parents,
therapists, clinicians and autistic adults are very welcome.

## Getting started

```
git clone https://github.com/snagaraj07/visitbridge.git
cd visitbridge
npm ci
npm test
npm run local
```

See the README for setting up `.env`.

## Making a change

1. Open an issue first for anything bigger than a small fix.
2. Create a branch from `main`.
3. Keep changes small and focused. Add or update tests in `test/`.
4. Run `npm test` before you push.
5. Open a pull request and fill in the template.

## Rules for stories

Changes to the story prompt (`src/ai.js`) must keep these:

- Describe, don't command. Never "be brave" or "don't cry".
- Be honest about anything that hurts and for how long.
- Keep the comfort item, the "it's OK to feel worried" page and the happy ending.
- Short sentences for young kids. Medical steps stay real.
- No blood, no needles touching skin, no characters from shows or brands.

## Privacy rules

- Never send the child's name or anything that identifies them to a model.
- Never log request content.
- Never commit keys. Use `.env` locally and `wrangler secret put` in production.

## Code style

Plain JavaScript modules, no build step, no runtime dependencies. Two-space
indent (see `.editorconfig`). Build DOM with `el()` from `public/js/dom.js`;
never use `innerHTML` with AI output.

By contributing you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md)
and that your work is released under the [MIT License](LICENSE).

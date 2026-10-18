# Security Policy

VisitBridge is used by parents of autistic children. Keeping information
about a child private is the first requirement of the project.

## Reporting a vulnerability

Please do not open a public issue. Report it privately through
[GitHub security advisories](https://github.com/snagaraj07/visitbridge/security/advisories/new).
You will get a reply within 3 days, and a fix or plan within 14 days.

## Supported versions

Only the latest version on `main`, deployed at https://visitbridge.alavai.ai,
gets security fixes.

## Security model

**Data about the child**
- Profiles, stories, pictures and videos are stored in the browser
  (localStorage and IndexedDB). There are no accounts and no database.
- The child's name is never sent to the story model. Free text is scrubbed of
  phone numbers, emails, dates of birth, MRNs, addresses and patient names
  before any model call (`src/scrub.js`).
- Server logs record only the route and error type, never request content.

**Secrets**
- API keys live only in Cloudflare Worker secrets (`wrangler secret put`) or a
  local `.env` that git ignores. No key is ever sent to the browser.
- `/api/health` reports which features are on, never key values.
- CI scans every push for leaked secrets (gitleaks).

**API protection**
- Every API route accepts only `POST` with JSON (or a form for voice upload).
- Requests from other websites are refused (Origin check), so other sites
  cannot spend this server's AI credit.
- Bodies over 2 MB (11 MB for voice recordings) are refused before parsing.
- Each visitor is limited to 120 API calls a minute (Cloudflare rate limiting).
- Inputs are checked and trimmed on the server; model output is checked
  against fixed lists, and missing safety pages are added back.
- Paid features (video, voice cloning) turn off when their key is not set.

**Browser protection** (`public/_headers`)
- A strict Content Security Policy: scripts, styles, fonts and requests only
  from this site; no inline scripts; no framing.
- HSTS, `nosniff`, `no-referrer`, `X-Frame-Options: DENY`, and a permissions
  policy that allows only the microphone (for an optional parent recording).
- All AI text is added to the page as text, never parsed as HTML.

**Supply chain**
- No runtime dependencies. Dev tools are pinned in `package-lock.json`.
- Dependabot checks npm packages and GitHub Actions every week.
- CodeQL scans the JavaScript on every push.

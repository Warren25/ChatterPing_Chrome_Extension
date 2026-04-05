# Changelog

## v1.1.0 — 2026-04-04

### New Features
- **Multi-keyword monitoring** — Track up to 5 keywords simultaneously with keyword pill selectors on Summary and Details tabs
- **Local data persistence** — Summaries and mention details are cached locally so data persists across popup opens
- **Sentiment scoring** — Each keyword gets a numerical sentiment score (0–10) and label (Very Negative → Very Positive) displayed below the AI Summary
- **Improved error UX** — Both Summary and Details tabs now show styled error messages with Retry buttons instead of generic text
- **Auto environment detection** — Extension auto-detects production vs local dev environment (no more manual toggle)

### Bug Fixes
- Fixed `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` crash on Render by adding `trust proxy` setting

### Infrastructure
- Added unit tests for `transformRedditData`, `removeDuplicates`, `strictFilter` (17 tests)
- Added cache layer tests (5 tests)
- Updated summarize tests for structured sentiment response
- 38 total server tests passing
- Added KTLO roadmap section for operational health

---

## v1.0.0 — 2026-03-15

### Initial Release
- Single-keyword Reddit mention monitoring
- AI-generated sentiment summary via GPT-4o-mini
- Tabbed popup UI (Summary, Details, Settings)
- Background badge count updates
- CORS, rate limiting, API key auth
- In-memory response cache (5-min TTL)

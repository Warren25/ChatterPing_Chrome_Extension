# ChatterPing Value & Feature Roadmap

## Current State (v0.1.0 — Published on Chrome Web Store)

ChatterPing is a Chrome extension + Express backend that monitors Reddit for a
single user-configured keyword, fetches recent mentions, and generates an
AI-powered sentiment summary via OpenAI GPT-3.5-turbo.

### What Works
- Keyword configuration via Settings tab (stored in chrome.storage.sync)
- Multi-strategy Reddit search with camelCase variation handling & deduplication
- AI-generated sentiment summaries with fallback when OpenAI key is missing
- Tabbed popup UI (Summary, Details, Settings) with loading states
- Background service worker badge updates on an alarm interval
- XSS protection via escapeHtml() in popup rendering
- Jest + Supertest server tests with mocked external dependencies
- CWS submission docs (privacy policy, data disclosure, listing copy)

---

## Critical Bugs (must fix before any new features)

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B1 | **`fetchMentions` return-type mismatch** — returns `{ mentions, mock, reason }` object, but `index.js` treats it as a flat array (`.length`, `.slice`, `.map`). Summarize and debug/reddit endpoints are silently broken. | `server/src/reddit.js` → `server/src/index.js` | **P0 — live breakage** |
| B2 | **CORS wide-open in production** — production branch does `callback(null, true)` for every origin. Any website can call the API. | `server/src/index.js` L30-33 | Security |
| B3 | **No rate limiting** — every request triggers Reddit fetch + OpenAI call. API credits can be drained trivially. | `server/src/index.js` | Cost / abuse |
| B4 | **No authentication** — nothing ties requests to legitimate ChatterPing users. | `server/src/index.js` | Security / cost |
| B5 | **No response caching** — popup open, alarm tick, and Details tab each fire fresh upstream calls for the same data. | server + extension | Performance / cost |
| B6 | **Double-fetch on install** — background.js fires `checkForMentions()` on both `onInstalled` and script load, plus popup fires its own call. | `extension/scripts/background.js` | Wasted API calls |
| B7 | **GPT-3.5-turbo is deprecated** — model may stop working without notice. Migrate to a current model. | `server/src/utils/openai.js` | Reliability |

## Dead Code to Remove

| Item | Location | Notes |
|------|----------|-------|
| `generateMockData()` | `server/src/reddit.js` | Defined but never called |
| `searchSubreddit()` | `server/src/reddit.js` | Defined but never called |
| Prisma `Mention` model | `server/prisma/schema.prisma` | Schema exists, nothing reads/writes it |
| Content script | `extension/scripts/content.js` | Runs on every page, scans DOM, does nothing with results |

## Tech Debt & Improvements

| Item | Notes |
|------|-------|
| Hardcoded `USE_PRODUCTION: true` toggle | Replace with build-time env detection or build script flag |
| Details tab error UX | Error element shows but with no user-friendly message |
| Single-keyword limit | Blocks competitive intelligence, multi-brand monitoring |
| No local data persistence | Every popup open fetches fresh; no history or trends possible |

---

## Unique Value Propositions

- **External Perspective**
  - Captures public sentiment and reviews from platforms outside the business’s own channels (Reddit, Twitter, forums, etc.)
  - Identifies issues or praise that customers may not share directly with the business
- **Competitive Intelligence**
  - Monitors mentions of competitors or industry trends
- **Reputation Management**
  - Alerts businesses to negative or positive posts before they go viral
- **Aggregated Insights**
  - Combines feedback from multiple sources for a holistic view
- **Discovery of Unsolicited Feedback**
  - Finds feedback from users who don’t engage with the business directly
- **Actionable Trends**
  - Highlights recurring themes or issues across platforms

## Feature List (with Complexity & Risks)

| Feature                          | Complexity | Risks/Challenges                                  |
|-----------------------------------|:----------:|--------------------------------------------------|
| Aggregated Mentions & Sentiment   |    3/5     | API limits, sentiment accuracy                    |
| Real-Time Alerts                  |    4/5     | Push infra, rate limits, notification fatigue     |
| Contextual Insights               |    3/5     | AI quality, false positives                       |
| Easy Response Tools               |    4/5     | Platform API limits, user auth, moderation        |
| Customizable Search               |    2/5     | UI complexity, user confusion                     |
| Actionable Recommendations        |    4/5     | AI reliability, actionable value                  |
| Historical Data & Visualizations  |    3/5     | Data storage, visualization accuracy              |
| Privacy & Data Control            |    2/5     | Compliance, user trust                           |
| Multi-Platform Integration        |    5/5     | API access, scraping legality, maintenance        |
| Competitive Intelligence          |    3/5     | Data quality, relevance                          |
| Aggregated Insights               |    3/5     | Data fusion, conflicting info                     |
| Discovery of Unsolicited Feedback |    3/5     | Data coverage, noise filtering                    |
| Actionable Trends                 |    3/5     | Trend detection, false positives                  |
| Reputation Management             |    3/5     | Timeliness, alert accuracy                       |
| External Perspective              |    2/5     | Platform coverage, data access                    |

## Ordered Implementation Roadmap

### Phase 0 — Stabilize (fix before anything else)
1. Fix `fetchMentions` return-type bug (B1)
2. Add server-side response caching with TTL (B5)
3. Add rate limiting (B3)
4. Add basic API key auth for extension→server calls (B4)
5. Tighten CORS to extension origins only (B2)
6. Migrate to current OpenAI model (B7)
7. Remove dead code (generateMockData, searchSubreddit, unused Prisma schema, content.js placeholder)
8. Fix double-fetch on install (B6)

### Phase 1 — Core Value (make it actually useful)
9. Multi-keyword support (track 3-5 keywords simultaneously)
10. Local data persistence (cache summaries + mention snapshots in chrome.storage.local)
11. Keyword-level sentiment scoring (not just text summary — numerical scores over time)
12. Improve Details tab error UX
13. Build-time environment config (replace hardcoded USE_PRODUCTION toggle)

### Phase 2 — Differentiation (things competitors don't do well)
14. Historical trend tracking with simple sparkline visualizations
15. Competitive comparison mode (side-by-side sentiment for your brand vs competitor)
16. Chrome notification alerts for significant sentiment shifts
17. Customizable search filters (subreddit allowlist, date range, score threshold)

### Phase 3 — Expansion
18. Multi-platform: add Hacker News, Product Hunt, or X/Twitter
19. Actionable AI recommendations (suggested responses, trend explanations)
20. Export/share reports (PDF or CSV)

## Notes
- Complexity scores: 1 (easy) to 5 (hard)
- Risks include technical, legal, and user experience challenges
- Multi-platform integration is the most complex due to API access, legal risks, and ongoing maintenance
- **Phase 0 is non-negotiable** — the app has live bugs and security gaps that must be resolved first
- Start with low-complexity, high-impact features for fastest value

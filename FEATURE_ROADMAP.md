# ChatterPing Value & Feature Roadmap

## Current State (v0.1.1 — Phase 0 Complete)

ChatterPing is a Chrome extension + Express backend that monitors Reddit for a
single user-configured keyword, fetches recent mentions, and generates an
AI-powered sentiment summary via OpenAI GPT-4o-mini.

### What Works
- Keyword configuration via Settings tab (stored in chrome.storage.sync)
- Multi-strategy Reddit search with camelCase variation handling & deduplication
- AI-generated sentiment summaries (GPT-4o-mini) with fallback when key is missing
- Tabbed popup UI (Summary, Details, Settings) with loading states
- Background service worker badge updates on an alarm interval
- XSS protection via escapeHtml() in popup rendering
- CORS locked to extension + localhost origins only
- API key authentication on all protected endpoints
- Rate limiting (20 req/min/IP) on protected endpoints
- In-memory response cache with 5-minute TTL
- Jest + Supertest server tests (16 tests) with mocked external dependencies
- CWS submission docs (privacy policy, data disclosure, listing copy)
- Deployed on Render with env-var secrets management

---

## Phase 0 — Resolved (all items fixed and shipped)

<details>
<summary>Bugs fixed</summary>

| # | Bug | Fix |
|---|-----|-----|
| B1 | `fetchMentions` return-type mismatch | Destructured `{ mentions }` in index.js endpoints |
| B2 | CORS wide-open in production | Removed permissive production branch; allowlist only |
| B3 | No rate limiting | Added express-rate-limit (20 req/min/IP) |
| B4 | No authentication | Added `requireApiKey` middleware + x-api-key header |
| B5 | No response caching | In-memory Map cache with 5-min TTL |
| B6 | Double-fetch on install | Removed standalone `checkForMentions()` call |
| B7 | Deprecated GPT-3.5-turbo | Migrated to GPT-4o-mini |

</details>

<details>
<summary>Dead code removed</summary>

- `generateMockData()` from reddit.js
- `searchSubreddit()` from reddit.js
- Prisma schema + prisma/sqlite3 deps
- Placeholder content.js (no manifest reference)

</details>

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

### Phase 0 — Stabilize ✅ Complete
All 7 bugs fixed, all dead code removed. See "Phase 0 — Resolved" section above.

### Phase 1 — Core Value (make it actually useful) ← **YOU ARE HERE**
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
- Phase 0 completed April 2026
- Start with low-complexity, high-impact features for fastest value

# Chrome Web Store Data Disclosure Worksheet

Last updated: 2026-03-15

Use this file to complete the Chrome Web Store Data Disclosure section consistently with the current ChatterPing implementation.

## Why this matters

Chrome Web Store frequently rejects extensions when listing disclosures do not match actual behavior. This worksheet maps your current code to disclosure-ready answers.

## Current Data Flows (Code-Based)

### Data stored by extension (Chrome sync storage)
- `keyword`
- `checkInterval`
- `notifications`
- `autoSummary`
- `lastCheck`

Sources:
- `extension/popup/popup.js`
- `extension/scripts/background.js`

### Data sent from extension to backend API
- User configured `keyword` query parameter:
  - `GET /summarize?keyword=...`
  - `GET /debug/reddit?keyword=...`

Sources:
- `extension/popup/popup.js`
- `extension/scripts/background.js`

### Backend processing
- Backend fetches Reddit public posts and generates summary text.
- Backend may log operational request metadata by infrastructure defaults (IP/user-agent/timestamp), depending on hosting configuration.

Sources:
- `server/src/index.js`
- `server/src/reddit.js`
- hosting platform configuration (outside repo)

## Recommended Disclosure Answers (Draft)

Use these as baseline answers in CWS; adjust if your hosting/logging behavior differs.

1. Does the extension collect user data?
- Yes.

2. What user data is collected?
- User-provided content/configuration: keyword entered by user.
- Extension settings/preferences stored in Chrome sync storage.

3. Is the data sold?
- No.

4. Is data used or transferred for purposes unrelated to core functionality?
- No.

5. Is data used for creditworthiness or lending purposes?
- No.

6. Is data used for personalized advertising?
- No.

7. Is data encrypted in transit?
- Yes (production endpoint uses HTTPS).

8. Can users request deletion or clear stored data?
- Yes (users can clear/reset extension settings or uninstall extension).

9. What is data used for?
- Core extension functionality: retrieving mention counts and generating summaries for the configured keyword.

## Disclosure Language You Can Reuse

"ChatterPing collects the keyword and settings entered by the user to provide mention monitoring and AI summary functionality. This data is transmitted to the ChatterPing backend API to fetch and summarize public mention data. ChatterPing does not sell user data and does not use collected data for advertising or unrelated purposes."

## Final Verification Checklist Before Submission

1. Confirm production API endpoint remains HTTPS-only in `extension/manifest.json`.
2. Confirm no broad site content scripts are enabled unintentionally.
3. Confirm privacy policy URL in CWS matches `PRIVACY_POLICY.md`.
4. Confirm hosting/log retention behavior (IP/user-agent logs) is accurately reflected.
5. Keep CWS disclosure responses synchronized with any future feature changes.

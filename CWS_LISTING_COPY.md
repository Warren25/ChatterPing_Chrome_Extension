# Chrome Web Store Listing Copy

Last updated: 2026-04-04

Use this copy in the Chrome Web Store listing fields. It is intentionally aligned to the current extension behavior and permissions.

## Single-Purpose Statement

ChatterPing helps users monitor public Reddit mentions for up to 5 configured keywords and view concise AI-generated summaries with sentiment scoring in a popup.

## Name

ChatterPing

## Short Description (132 chars max target)

Track Reddit mentions for up to 5 keywords with AI summaries, sentiment scores, and badge count updates.

## Detailed Description

ChatterPing is a focused Reddit mention monitor that tracks up to 5 keywords simultaneously.

How it works:
- Add up to 5 keywords or brand names in Settings.
- ChatterPing checks recent Reddit mentions via the ChatterPing API.
- The popup shows mention counts, recent details, AI summaries, and sentiment scores for each keyword.
- Switch between keywords with pill selectors on Summary and Details tabs.
- Data is cached locally so your results persist between popup opens.
- The extension badge updates to show total mention volume at a glance.

What's new in v1.1.0:
- Multi-keyword monitoring (up to 5 keywords)
- Sentiment scoring (0-10 scale with labels)
- Local data persistence
- Improved error handling with retry buttons

What ChatterPing does not do:
- It does not inject content scripts into websites.
- It does not sell user data.
- It does not run unrelated browsing analysis.

Permissions explanation:
- storage: saves your keywords, preferences, and cached data.
- alarms: schedules periodic mention checks for badge updates.
- host permission (API domain): allows secure requests to the ChatterPing backend.

## Category Suggestion

Productivity

## Support URL

https://github.com/Warren25/ChatterPing_Chrome_Extension

## Privacy Policy URL

https://github.com/Warren25/ChatterPing_Chrome_Extension/blob/main/PRIVACY_POLICY.md

## Reviewer Notes (Optional)

- ChatterPing has a single purpose: Reddit keyword monitoring with AI summary and sentiment scoring output.
- v1.1.0 adds multi-keyword support (up to 5), sentiment scores, and local caching.
- No broad tab/content script access is used in the current release.
- Data disclosure worksheet is included in the repo: CWS_DATA_DISCLOSURE.md

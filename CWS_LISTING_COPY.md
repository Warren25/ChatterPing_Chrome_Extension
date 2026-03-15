# Chrome Web Store Listing Copy

Last updated: 2026-03-15

Use this copy in the Chrome Web Store listing fields. It is intentionally aligned to the current extension behavior and permissions.

## Single-Purpose Statement

ChatterPing helps users monitor public Reddit mentions for one configured keyword and view a concise AI-generated summary in a popup.

## Name

ChatterPing

## Short Description (132 chars max target)

Track Reddit mentions for one keyword and get an AI summary plus badge count updates in your browser.

## Detailed Description

ChatterPing is a focused Reddit mention monitor for one keyword at a time.

How it works:
- You enter a keyword in Settings.
- ChatterPing checks recent Reddit mentions via the ChatterPing API.
- The popup shows mention count, recent details, and an AI summary.
- The extension badge updates to show mention volume at a glance.

What ChatterPing does not do:
- It does not inject content scripts into websites.
- It does not sell user data.
- It does not run unrelated browsing analysis.

Permissions explanation:
- storage: saves your keyword and preferences.
- alarms: schedules periodic mention checks for badge updates.
- host permission (API domain): allows secure requests to the ChatterPing backend.

## Category Suggestion

Productivity

## Support URL

https://github.com/Warren25/ChatterPing_Chrome_Extension

## Privacy Policy URL

https://github.com/Warren25/ChatterPing_Chrome_Extension/blob/main/PRIVACY_POLICY.md

## Reviewer Notes (Optional)

- ChatterPing has a single purpose: Reddit keyword monitoring with AI summary output.
- No broad tab/content script access is used in the current release.
- Data disclosure worksheet is included in the repo: CWS_DATA_DISCLOSURE.md

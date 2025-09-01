# Testing Structure for ChatterPing

## Directory Structure
```
tests/
├── server/           # Backend API tests
│   ├── health.test.js
│   ├── summarize.test.js
│   └── reddit.test.js
├── extension/        # Chrome extension tests
│   ├── popup.test.js
│   ├── background.test.js
│   └── content.test.js
└── e2e/             # End-to-end integration tests
    └── extension-server.test.js
```

## Test Types

### Unit Tests
- **Server**: Test individual API endpoints, Reddit fetching, OpenAI integration
- **Extension**: Test popup logic, background script functions

### Integration Tests
- Test extension ↔ server communication
- Test full data flow: Reddit → OpenAI → Extension

### Manual Tests
- Load extension in Chrome
- Test popup UI and functionality
- Verify background script behavior

## Test Frameworks
- **Server**: Jest + Supertest (for API testing)
- **Extension**: Jest + Chrome Extension Testing Library
- **E2E**: Playwright or Puppeteer for browser automation

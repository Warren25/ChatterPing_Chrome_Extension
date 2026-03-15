# ChatterPing — Chrome Web Store Submission Checklist

Use this checklist every time you submit or update the extension on the Chrome Web Store.

---

## 1. Pre-Build Verification

- [ ] All code changes are committed and pushed to `main`
- [ ] `extension/manifest.json` version matches the intended release version
- [ ] Run server tests: `cd server && npm test` → all tests pass
- [ ] Load the extension locally (Chrome → `chrome://extensions` → Load unpacked → `extension/`) and smoke-test:
  - [ ] Enter a keyword and save settings
  - [ ] Summary loads with no console errors
  - [ ] Badge count updates after polling interval
  - [ ] Version label in popup matches manifest version
  - [ ] Details tab populates correctly

---

## 2. Build the Zip

```bash
bash scripts/build-extension.sh
```

- [ ] Script completes with no errors
- [ ] `dist/chatterping-v<VERSION>.zip` was created
- [ ] Verify zip contents (printed automatically) — confirm **only** `extension/` files are included (no `server/`, `tests/`, `node_modules/`, `.DS_Store`, etc.)

---

## 3. Test the Zip

- [ ] In Chrome, go to `chrome://extensions`
- [ ] Remove the unpacked dev version
- [ ] Drag-and-drop `dist/chatterping-v<VERSION>.zip` onto the extensions page **or** install via "Load unpacked" from a temp-unzipped copy
- [ ] Re-run all smoke tests from step 1 against the zipped build

---

## 4. Store Assets (manual — do once per major release)

- [ ] **Screenshots:** At least 1 screenshot at 1280×800 or 640×400. Capture the popup with a real summary result showing.
- [ ] **Promotional tile:** 440×280 PNG (optional but recommended for featured placement)
- [ ] **Icon:** 128×128 PNG already in `extension/icons/icon128.png` — confirm it's clean on a white background

---

## 5. Store Listing Fields

Reference [CWS_LISTING_COPY.md](CWS_LISTING_COPY.md) for all copy. Confirm before submitting:

- [ ] **Name:** ChatterPing
- [ ] **Short description** (≤132 chars): copied from `CWS_LISTING_COPY.md`
- [ ] **Detailed description:** copied from `CWS_LISTING_COPY.md`
- [ ] **Category:** Productivity
- [ ] **Privacy Policy URL:** `https://github.com/Warren25/ChatterPing_Chrome_Extension/blob/main/PRIVACY_POLICY.md`
- [ ] **Single-purpose justification:** copied from `CWS_LISTING_COPY.md`

---

## 6. Data Use Disclosure (CWS Developer Dashboard)

Reference [CWS_DATA_DISCLOSURE.md](CWS_DATA_DISCLOSURE.md). In the dashboard Privacy tab:

- [ ] "Does your extension collect or transmit any user data?" → **Yes**
- [ ] Check: **User activity** (keyword you enter is sent to the API)
- [ ] Certify that data is not sold and is not used for advertising
- [ ] Confirm data use justification entered in the disclosure form

---

## 7. Publish

- [ ] Upload `dist/chatterping-v<VERSION>.zip` to the Chrome Web Store Developer Dashboard
- [ ] Submit for review
- [ ] Note submission date — typical review is 1–3 business days
- [ ] After approval, verify the live store listing looks correct before announcing

---

## 8. Post-Submit

- [ ] Tag the release in git: `git tag v<VERSION> && git push origin v<VERSION>`
- [ ] Update README.md with the published Chrome Web Store link (once live)

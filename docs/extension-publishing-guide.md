# Extension Publishing Guide (Chrome Web Store)

This guide describes how to publish **BeeContour — Extract the main outline** to the **Chrome Web Store**.

It covers:

- creating a developer account
- preparing the upload package (ZIP)
- completing the store listing
- submitting for review
- understanding review outcomes and feedback

---

## 1. Create a Chrome Web Store developer account

1. Open the **Chrome Web Store Developer Dashboard**.
2. Sign in with a Google account.
3. Complete the developer registration steps shown in the dashboard.

Notes:

- Publishing extensions requires using the Developer Dashboard.
- All uploads, listing configuration, and review status are managed there.

---

## 2. Prepare the ZIP to upload

The Chrome Web Store expects a **ZIP archive** containing the extension.

### ZIP structure requirements

The ZIP must contain the extension with `manifest.json` at the root:

```text
your-extension.zip
├── manifest.json
├── background.js
├── content.js
├── ...
└── assets/
````

### Use the release ZIP

Use the ZIP produced by your project’s release workflow.

This ensures:

* the uploaded artifact matches the shipped version
* no differences between local builds and published builds

---

## 3. Upload the ZIP in the Developer Dashboard

1. Open the Developer Dashboard.
2. Click **Add new item**.
3. Select and upload the extension ZIP.

If the ZIP and manifest are valid, the dashboard opens the listing editor.

---

## 4. Complete the store listing

In the listing editor, complete the required fields.
Field names may change slightly over time, but typically include:

### Store listing text

* Extension name
* Short description
* Detailed description
* Category

### Visual assets

* Extension icon(s)
* Screenshots
* Optional promotional images

### Links

* Homepage URL (for example: `https://nathabee.github.io/beecontour/`)
* Support URL (for example: `https://github.com/nathabee/beecontour/issues`)

---

## 5. Complete the “Privacy practices” section

Chrome Web Store requires accurate privacy disclosures.

You will typically describe:

* what the extension does
* which permissions it uses and why
* whether it accesses, processes, or stores user data

Important principles:

* The listing must match actual behavior.
* Do not claim data collection if none occurs.
* Do not omit data handling if it exists.

Inaccurate or misleading disclosures are a common cause of rejection.

---

## 6. Submit for review

When the listing and privacy practices are complete, select **Submit for review**.

Review times vary depending on extension complexity and policy checks.

---

## 7. What Chrome Web Store checks during review

The review process may include:

* automated validation of the ZIP and manifest
* policy compliance checks (permissions, disclosures, behavior)
* listing accuracy checks (claims vs actual functionality)
* security and abuse detection signals

Google does not publish a full internal checklist.
Rejections include policy references when violations are detected.

---

## 8. Review outcomes and feedback

### Approved

The extension becomes publishable or is published automatically, depending on dashboard settings.

### Rejected

If issues are found, the submission may be rejected.

* The dashboard shows rejection reasons.
* You can fix the issues and resubmit.

In some cases, issues in a new submission may trigger review of an already-published version.

### Where to find feedback

* Primary: Developer Dashboard status and notes
* Secondary: email notifications linked to the developer account

---

## 9. Recommended pre-submit checklist

Before submitting:

1. Install the extension locally using **Load unpacked**.
2. Verify:

   * no runtime errors in the service worker
   * no console errors in UI or content scripts
3. Build the release ZIP using the project’s release script.
4. Install from the extracted release ZIP (sanity check).
5. Upload the ZIP to the Developer Dashboard.
6. Complete listing and privacy sections.
7. Submit for review.

---

 
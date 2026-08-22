# Release runbook

Publishing DCV means uploading a zip to the existing Chrome Web Store item so
current users receive it as an automatic update. Get the version and the archive
shape right and the rest is routine.

- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Item id:** `01c98f36-54b6-4b5d-9068-e51eb9aa8e93`
- **Extension id:** `jagbdijnbgbohlggdnacpdlbnmmplkpl`

Always update the existing item. Publishing a new item would give users a
different extension id and strand everyone on the old version.

---

## 1. Decide the version

`manifest.json` must carry a version **strictly higher** than the one currently
published — the store rejects a re-upload at the same version, and there is no
way to overwrite a published package.

Use semantic versioning:

| Change | Bump |
|---|---|
| Detection tweak, copy change, bug fix | patch — `0.0.1` → `0.0.2` |
| New capability, another mail client, options page | minor — `0.0.2` → `0.1.0` |
| New permissions or a redesign users must relearn | major — `0.1.0` → `1.0.0` |

## 2. Update the record

- [ ] `version` bumped in `manifest.json`
- [ ] [CHANGELOG.md](../CHANGELOG.md) entry moved from Unreleased into a dated section
- [ ] [README.md](../README.md) release-history table updated
- [ ] [docs/STORE_LISTING.md](STORE_LISTING.md) updated if any listing copy changed

## 3. Test the unpacked build

Load the folder in `chrome://extensions` and walk the checklist in the README's
[Development](../README.md#development) section: legitimate message, suspicious
message, inbox list, tab switch, non-Gmail page. Confirm the **Errors** button on
the extension card is absent, and that the service worker console is clean.

## 4. Package

The archive must contain `manifest.json` **at its top level** — zipping the
folder itself produces a nested directory and the store rejects it.

```bash
cd domain-content-validator-chrome-extension
zip -r ../dcv-<version>.zip . \
  -x '.git/*' '.github/*' 'docs/*' '*.md' '.gitignore' '.DS_Store'
```

Verify before uploading:

```bash
unzip -l ../dcv-<version>.zip | head
# manifest.json, background.js, content.js, popup/, assets/ — no nested root
```

## 5. Tag

```bash
git tag v<version>
git push origin v<version>
```

## 6. Upload and submit

1. Open the item in the Developer Dashboard.
2. **Package → Upload new package**, select the zip.
3. Review the **Privacy practices** tab. If the change touched permissions,
   storage, or network behavior, update the justifications and the data-use
   declarations — see [STORE_LISTING.md](STORE_LISTING.md).
4. Update the listing copy and screenshots if the UI changed.
5. **Submit for review.**

## 7. After submission

Review usually takes a few days. Changes that add permissions, broaden host
matches, or alter data-use declarations take longer and draw more scrutiny — the
justification text is what reviewers read, so make it specific.

Once published, confirm the live listing shows the new version and that an
installed copy updates (Chrome checks roughly every few hours; `chrome://extensions`
→ **Update** forces it).

---

## If a release is rejected

Read the rejection carefully — it names a policy section. The common causes for
an extension like this one:

| Cause | Fix |
|---|---|
| Permission not justified | Narrow the permission, or rewrite the justification to name the exact API call and feature |
| Host matches broader than the functionality | Restrict `content_scripts.matches` to the clients actually supported |
| Data-use declaration inconsistent with the code | Make them agree — usually by removing the code, not by widening the declaration |
| Remote code | MV3 forbids it; inline or self-host the resource |

Fix, bump the patch version again, and resubmit.

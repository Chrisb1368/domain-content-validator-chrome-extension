# Chrome Web Store listing (canonical copy)

This file is the version-controlled source of truth for what appears on the
public store listing. When the listing changes in the
[Developer Dashboard](https://chrome.google.com/webstore/devconsole), update
this file in the same pull request so the repository and the store never drift.

- **Public listing:** https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl
- **Extension ID:** `jagbdijnbgbohlggdnacpdlbnmmplkpl`
- **Developer Dashboard item:** `01c98f36-54b6-4b5d-9068-e51eb9aa8e93`

---

## Item metadata

| Field | Value |
|---|---|
| Name | Domain-Content Validator |
| Version | 0.0.1 |
| Last updated | October 4, 2023 |
| Offered by | Christopher Benavides |
| Developer email | montageapplication@gmail.com |
| Package size | 1.48 MiB |
| Category | Privacy & Security |
| Languages | English (United States) |
| Rating | 5.0 ★ (1 rating) |
| Users | 8 |
| Trader status | Non-trader — "This developer has not identified itself as a trader. For consumers in the European Union, please note that consumer rights do not apply to contracts between you and this developer." |
| Privacy policy | https://www.timemotionstudy.com/private-policy |

---

## Short description (tagline)

> Protect yourself from email scams! Download the DCV Chrome extension to detect and alert on suspicious emails. Stay safe!

The short description is capped at 132 characters by the store. The current
text is well inside that limit.

---

## Detailed description (as published)

> Protect yourself from email scams! Download the DCV Chrome extension to detect and alert on suspicious emails. Stay safe!
>
> Stay safe from fraudulent emails! The Domain-Content Validator (DCV) Chrome extension helps you verify the authenticity of emails by analyzing the correlation between the domain of the sender and the body of the email. If there's a mismatch or any suspicious patterns, DCV will alert you, reducing the risk of falling victim to scams.
>
> **Why DCV?**
>
> Phishing attacks and fraudulent emails are on the rise. Often, scammers use mismatched domains and content to deceive users. By cross-checking the domain and content, DCV provides an additional layer of security, ensuring you're protected against potential threats.
>
> **How it works:**
>
> 1. Upon receiving an email, DCV will scan the body of the text.
> 2. It compares key content elements with the sender's domain to determine authenticity.
> 3. If an inconsistency or suspicious pattern is found, where the domain of the sender does not match any text in the body, then DCV will notify you via a visual alert, ensuring you remain aware and vigilant of this.
> 4. All processes respect user privacy and no email content is stored or shared externally.
>
> **Features:**
>
> 1. (Current) Domain-Body Correlation Analysis: Cross-checks the content of the email with the domain of the sender to identify potential inconsistencies or red flags.
>
> 2. (Current) Real-time Alerts: Notifies you immediately if a suspicious email is detected, allowing you to take action quickly. Popup window. Provides insights into why an email might be suspicious, giving you the knowledge to make informed decisions.

Note the "(Current)" prefixes: the listing distinguishes shipped features from
planned ones. Anything added to the [roadmap](../README.md#roadmap) and later shipped
should be promoted into this list with the same prefix convention.

---

## Privacy disclosures (as published)

> The developer has disclosed that it will not collect or use your data. To learn more, see the developer's privacy policy.
>
> This developer declares that your data is:
>
> - Not being sold to third parties, outside of the approved use cases
> - Not being used or transferred for purposes that are unrelated to the item's core functionality
> - Not being used or transferred to determine creditworthiness or for lending purposes

The extension declares **no data collection at all**. That is a strong claim
and it constrains the code: see [PRIVACY.md](../PRIVACY.md) for what the
codebase must never do in order to keep it true.

---

## Permission justifications

The store requires a written justification for each permission at review time.
These must describe what the code in the uploaded package actually does —
reviewers compare them against `manifest.json`.

| Requested | Justification |
|---|---|
| `tabs` | `chrome.tabs.onUpdated` reads `tab.url` to detect when the user has navigated to a different email, and `chrome.tabs.sendMessage` wakes the content script. Reading `tab.url` is what requires this permission. |
| `storage` | `chrome.storage.session` holds the current three-state verdict so the toolbar popup can display it. Session storage is cleared when the browser closes. No email content is stored. |
| Content script `matches: ["<all_urls>"]` | The content script is currently injected on every page and exits immediately unless the URL is an open Gmail message. **This is broader than the feature requires** and should be narrowed to `https://mail.google.com/*` — reviewers frequently push back on `<all_urls>` when the functionality is single-site. |

**Single purpose statement:** Domain-Content Validator has one purpose — to warn
the user when the sending domain of an email they are reading does not appear in
the content of that email, which is a common indicator of phishing.

**Remote code:** none. The extension executes only the code in the uploaded
package. Note that `popup/index.html` currently links a stylesheet from
`fonts.googleapis.com`; that is a remote *resource*, not remote code, but it is
scheduled for removal — see [../PRIVACY.md](../PRIVACY.md).

## Assets checklist

| Asset | Requirement | Status |
|---|---|---|
| Store icon | 128×128 PNG | Published; source not yet in repo — see [assets/README.md](../assets/README.md) |
| Screenshots | 1280×800 or 640×400, at least one | Published |
| Small promo tile | 440×280 | Optional |
| Marquee promo tile | 1400×560 | Optional |

---

## Listing update checklist

- [ ] Detailed description reflects features that actually ship in this version
- [ ] Screenshots show the current UI
- [ ] Permission justifications match `manifest.json` exactly
- [ ] Privacy disclosures still true after the code change
- [ ] Privacy policy URL resolves
- [ ] This file updated in the same pull request

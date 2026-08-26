# Domain-Content Validator (DCV)

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-live-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl)
[![Version](https://img.shields.io/badge/version-0.0.1-blue)](CHANGELOG.md)
[![Manifest](https://img.shields.io/badge/manifest-v3-success)](#manifest--permissions)
[![Category](https://img.shields.io/badge/category-Privacy%20%26%20Security-8A2BE2)](https://chromewebstore.google.com/category/extensions/privacy)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

**Protect yourself from email scams.** DCV checks whether the domain an email
comes *from* actually appears in what the email *says* — and warns you when it
doesn't.

> **Install →** [Domain-Content Validator on the Chrome Web Store](https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [How it works](#how-it-works)
- [Installation](#installation)
- [Project structure](#project-structure)
- [Manifest & permissions](#manifest--permissions)
- [Architecture](#architecture)
- [Development](#development)
- [Known limitations & cleanup backlog](#known-limitations--cleanup-backlog)
- [Roadmap](#roadmap)
- [Privacy & data handling](#privacy--data-handling)
- [Release & publishing](#release--publishing)
- [Contributing](#contributing)
- [Release history](#release-history)
- [Support](#support)
- [Maintainers](#maintainers)
- [License](#license)
- [Further reading](#further-reading)

---

## Overview

Phishing attacks and fraudulent emails are on the rise, and scammers routinely
use mismatched domains and content to deceive people. DCV adds a layer of
defense that most filters skip: it compares **who the message claims to be
from** against **what the message actually says**.

If a message arrives from `secure-billing-update.example` but the body is all
about your bank, the sending domain never appears in the content. That
disagreement is the signal DCV looks for, and it surfaces it while you are
reading the message — not in a report you check later.

Everything runs in the browser. No email content is stored or sent anywhere.

**At a glance**

| | |
|---|---|
| **Name** | Domain-Content Validator (DCV) |
| **Extension ID** | `jagbdijnbgbohlggdnacpdlbnmmplkpl` |
| **Published version** | 0.0.1 (October 4, 2023) |
| **Manifest version** | 3 |
| **Supported client** | Gmail on the web (`mail.google.com`) |
| **Store category** | Privacy & Security |
| **Languages** | English (United States) |
| **Package size** | ~1.48 MiB |
| **Rating** | 5.0 ★ |
| **Privacy policy** | None published — [PRIVACY.md](PRIVACY.md) is the statement of record |

---

## Features

### Domain–body correlation analysis *(current)*

Cross-checks the content of the email with the domain of the sender to identify
potential inconsistencies or red flags. DCV pulls the sender's domain out of the
Gmail header, then searches the message body for that domain name. A body that
never mentions the domain it came from is the red flag.

### Real-time alerts *(current)*

Notifies you immediately when a suspicious email is detected, so you can act
before you click anything. The warning explains *why* the message was flagged,
and the toolbar popup keeps the verdict for the message you are reading:

| Popup state | When it shows | Message |
|---|---|---|
| ❌ **Potential Fraud Alert!** | Sender domain does not appear in the body | "The sender's domain and the email content have inconsistencies. Be cautious before interacting with this email or its content." |
| ✅ **Safe Email Detected** | Sender domain appears in the body | "The sender's domain and the email content show no suspicious correlation. It appears genuine at a first glance. Always remain cautious!" |
| ✅ **No Email Detected** | Not looking at an open message | "You can browse freely, a notification popup will appear if something suspicious is detected." |

### Privacy-preserving by design *(current)*

All processing happens client-side. No email content is stored or shared
externally — see [PRIVACY.md](PRIVACY.md) for exactly what is and is not kept.

---

## How it works

```
 User opens a message in Gmail
              │
              ▼
 ┌────────────────────────────────┐
 │ background.js                  │  chrome.tabs.onUpdated / onActivated
 │ (service worker)               │  → sends { exe: true } to the tab
 └───────────────┬────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐
 │ content.js                     │  Polls every 2s until the page has
 │ (runs inside the Gmail page)   │  rendered (> 1000 chars of text)
 └───────────────┬────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐
 │ validate(url)                  │  1. Is this an open Gmail message?
 │                                │  2. Read sender from  .go
 │                                │  3. Read body from    .a3s
 │                                │  4. Does the body mention the domain?
 └───────────────┬────────────────┘
                 │  "sus" | "not" | false
                 ├──────────────────────────────► alert() if "sus"
                 ▼
 ┌────────────────────────────────┐
 │ chrome.storage.session         │  { suspicious, urlPath }
 └───────────────┬────────────────┘
                 │  storage.onChanged
                 ▼
 ┌────────────────────────────────┐
 │ popup/                         │  Renders the verdict with an icon,
 │ (toolbar popup)                │  heading, and explanation
 └────────────────────────────────┘
```

**Verdict values**

| Value | Meaning |
|---|---|
| `"sus"` | Suspicious — the sender's domain never appears in the message body, or the sender element could not be found |
| `"not"` | The domain appears at least once in the body |
| `false` | Not an open Gmail message; nothing to evaluate |

The step-by-step detection logic, including every edge case and its known
weaknesses, is documented in [docs/DETECTION.md](docs/DETECTION.md).

---

## Installation

### From the Chrome Web Store (recommended)

1. Open the [store listing](https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl).
2. Click **Add to Chrome**, then **Add extension**.
3. Open Gmail and read a message — DCV runs automatically.

### From source (development build)

```bash
git clone https://github.com/Chrisb1368/domain-content-validator-chrome-extension.git
cd domain-content-validator-chrome-extension
```

Then in Chrome:

1. Go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the repository folder — the one containing
   `manifest.json`.
4. Pin the extension so the popup is one click away.

> **⚠️ Do not delete `assets/logo1.png`.** `manifest.json` references it
> for every icon size, and Chrome refuses to load an unpacked extension whose
> icon files are missing. See [assets/README.md](assets/README.md).

---

## Project structure

```
domain-content-validator-chrome-extension/
├── manifest.json           # MV3 manifest: entry points, permissions, matches
├── background.js           # Service worker: tab events + session state
├── content.js              # Injected into pages: detection + alert
├── popup/
│   ├── index.html          # Toolbar popup markup
│   ├── script.js           # Reads the stored verdict, renders the card
│   └── style.css           # Popup styling (300px wide)
├── assets/
│   └── logo1.png           # Extension icon — required by manifest.json
├── docs/
│   ├── ARCHITECTURE.md     # Module responsibilities and message flow
│   ├── DETECTION.md        # The heuristic, line by line, with its limits
│   ├── RELEASING.md        # Packaging and store submission runbook
│   └── STORE_LISTING.md    # Version-controlled copy of the store listing
├── .github/                # PR/issue templates, CODEOWNERS, CI
├── CHANGELOG.md
├── CONTRIBUTING.md
├── PRIVACY.md
├── SECURITY.md
├── LICENSE
└── README.md
```

The layout is flat on purpose: `manifest.json` sits at the repository root so
the repo folder can be loaded unpacked and zipped for the store without a build
step. Keep it that way — see [docs/RELEASING.md](docs/RELEASING.md).

---

## Manifest & permissions

```jsonc
{
  "manifest_version": 3,
  "permissions": ["tabs", "storage"],
  "background":      { "service_worker": "background.js" },
  "content_scripts": [{ "matches": ["<all_urls>"], "js": ["content.js"] }],
  "action":          { "default_popup": "./popup/index.html" }
}
```

| Permission | What the code actually uses it for |
|---|---|
| `tabs` | `chrome.tabs.onUpdated` reads `tab.url` to decide whether the open message changed, and `chrome.tabs.sendMessage` wakes the content script. Reading `tab.url` is what requires this permission. |
| `storage` | `chrome.storage.session` holds the current verdict so the popup can render it. Session storage is cleared when the browser closes. |
| `<all_urls>` (content script matches) | Currently the content script is injected everywhere, then exits immediately on non-Gmail pages. **This is broader than the feature needs** — see the cleanup backlog below. |

There is no `host_permissions` key, no network permission, and no
`webRequest`/`cookies`/`history` access.

---

## Architecture

### `background.js` — service worker

Owns two things: waking the content script, and holding the verdict.

- **`chrome.runtime.onMessage`** — when the content script reports a result
  (`{ save: true, suspicious, path }`), writes `{ suspicious, urlPath }` into
  `chrome.storage.session`.
- **`chrome.tabs.onUpdated`** — waits for `status === "complete"`, then compares
  the tab URL against the stored `urlPath`. If the user has navigated to a
  different message, it sends `{ exe: true }` to re-run detection.
- **`chrome.tabs.onActivated`** — sends `{ exe: true }` when the user switches
  tabs, so returning to a Gmail tab re-evaluates the open message.

Because MV3 service workers are torn down when idle, all state that must outlive
a run goes to `chrome.storage.session` — never to a module-level variable.

### `content.js` — page context

The only code with DOM access.

- Listens for `{ exe: true }`, then polls every 2 seconds until the page has
  rendered (`document.body.textContent.length > 1000`). Gmail is a single-page
  app, so the DOM is usually not ready when the tab reports "complete".
- `validate(url)` performs the check and returns `"sus"`, `"not"`, or `false`.
- On `"sus"`, raises a native `alert()` with the warning text and reports the
  verdict to the background worker.

### `popup/` — toolbar UI

Purely a view. `script.js` reads `suspicious` out of `chrome.storage.session`,
picks one of three icon/heading/message triples, and writes them into the
markup. It re-renders on `chrome.storage.onChanged`, so the popup updates live
while it is open. It never analyzes anything itself.

### Message contract

```js
// content.js → background.js
{ save: true, suspicious: "sus" | "not" | false, path: "<gmail message id>" }

// background.js → content.js
{ exe: true }

// background.js → chrome.storage.session
{ suspicious: "sus" | "not" | false, urlPath: "<gmail message id>" }
```

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Development

### Prerequisites

- Google Chrome 102 or later (Manifest V3 service workers)
- Git
- A text editor

There is no build step, no bundler, and no `node_modules`. The extension ships
exactly the files in this repository.

### Everyday loop

1. Load the folder unpacked (see [Installation](#installation)).
2. Edit files.
3. Go to `chrome://extensions` and click **reload** on the DCV card.
4. Reload the Gmail tab — content scripts are only injected on page load.

### Debugging

| What | Where |
|---|---|
| Service worker logs | `chrome://extensions` → **Service worker** link on the DCV card |
| Content script logs | Gmail tab → DevTools console |
| Popup logs | Right-click the toolbar icon → **Inspect popup** |
| Session storage | Service worker DevTools → Application → Storage → Extension storage → Session |
| Manifest errors | `chrome://extensions` → **Errors** button on the card |

### Testing a detection change

Gmail's class names are obfuscated and change without notice, so verify against
real mail rather than a fixture:

1. Open a legitimate message whose sender domain appears in the body (a receipt,
   a newsletter) — expect **Safe Email Detected**.
2. Open a message from a domain that is never mentioned in the body — expect the
   alert and **Potential Fraud Alert!**.
3. Open the inbox list with no message selected — expect **No Email Detected**.
4. Switch to another tab and back — the verdict should re-evaluate.
5. Open a non-Gmail page — nothing should happen and no alert should fire.

---

## Known limitations & cleanup backlog

Written down deliberately: these are real properties of the shipped 0.0.1 code,
and each one is a concrete task rather than a vague "improve detection".

**Detection**

1. **Gmail only.** `validate()` returns early unless the URL starts with
   `https://mail.google.com/`. Every other client is unprotected.
2. **Brittle selectors.** The sender comes from `.go` and the body from `.a3s` —
   obfuscated Gmail class names that can change at any time. When they do, DCV
   silently degrades: a missing `.go` returns `"sus"`, so *every* message starts
   getting flagged.
3. **Substring matching is coarse.** The domain's first label is matched
   case-insensitively anywhere in the body HTML, including inside URLs,
   attributes, and unrelated words. `paypal.com` matches any body containing
   "paypal" — which a phisher will happily include.
4. **One mention is enough.** A single occurrence flips the verdict to safe, so
   the check is easy to defeat on purpose.
5. **Unescaped regex.** `new RegExp(domain, "gi")` is built from text taken out
   of the page. A domain containing regex metacharacters produces a wrong
   pattern or throws.
6. **`url.split("#")[1]` throws** when a `mail.google.com` URL has no fragment.
7. **No signal beyond the domain.** Urgency language, credential requests, and
   links whose display text disagrees with their target are not considered.

**Permissions and packaging**

8. **`<all_urls>` is too broad.** The content script only does work on Gmail, so
   `matches` should be narrowed to `https://mail.google.com/*`. This reduces
   review friction and the permission warning users see at install.
9. **`background.matches` is not a valid key.** MV3 ignores it; it should be
   removed.

**UI**

10. **`alert()` blocks the page**, cannot be styled, and is easy to dismiss
    reflexively. An injected inline banner would be both safer and clearer.
11. **Leftover boilerplate in the popup.** `popup/index.html` still carries
    `<title>Controller Mapper</title>` and a "Map keyboard/mouse keys to the
    controller" meta description from another project.
12. **A remote font is loaded.** The popup links Google Fonts, which makes a
    network request to `fonts.googleapis.com` whenever it opens. Self-host or
    drop it — the extension advertises that it collects no data, and an outbound
    request undercuts that claim even though no message content is involved.
13. **Dead code.** `popup/script.js` still contains `getTabURL()` and a copy of
    `validate()` that run against the popup's own DOM and can never succeed.

---

## Roadmap

- [x] Add `assets/logo1.png` so the repository is loadable and packageable
- [ ] Narrow `content_scripts.matches` to `https://mail.google.com/*`
- [ ] Remove the invalid `background.matches` key and the dead popup code
- [ ] Fix the popup title and meta description
- [ ] Self-host or remove the Google Fonts dependency
- [ ] Escape the domain before building the detection regex; guard the hash split
- [ ] Replace `alert()` with an inline, dismissible banner in the message pane
- [ ] Score matches instead of using a single boolean (occurrence count, position, link targets)
- [ ] Lookalike-domain detection: homoglyph and edit-distance checks against a known-brand list
- [ ] Flag links whose display text and real target disagree
- [ ] Additional clients: Outlook Web, Yahoo Mail, Proton Mail
- [ ] Options page: sensitivity, per-domain allowlist, enable/disable
- [ ] Extract detection into a pure module with unit tests
- [ ] Publish a privacy policy page and correct the URL on the store listing
- [ ] Localization beyond en-US

---

## Privacy & data handling

- **Local-only analysis.** Message content is read from the page and evaluated in
  the browser. It is never sent to a server; the extension makes no API calls.
- **Nothing durable is written.** The only stored values are `suspicious` (a
  three-state verdict) and `urlPath` (the Gmail message id from the URL
  fragment), both in `chrome.storage.session`, which Chrome clears when the
  browser closes.
- **No message content is stored.** Subjects, bodies, and sender addresses are
  used in memory and discarded.
- **No third-party sharing or sale of data.**
- **No analytics, telemetry, or crash reporting.**

The full policy, including the changes that would require re-declaring data
practices on the store, is in [PRIVACY.md](PRIVACY.md), which is the statement of
record for this extension. No separate privacy policy page is published.

---

## Release & publishing

Short version: bump `version` in `manifest.json`, zip the repository root so
`manifest.json` sits at the top of the archive, and upload it to the existing
store item so current users get it as an upgrade.

```bash
zip -r ../dcv-0.0.2.zip . \
  -x '.git/*' '.github/*' 'docs/*' '*.md' '.gitignore' '.DS_Store'
```

The full runbook — version rules, review expectations, what to update on the
listing — is in [docs/RELEASING.md](docs/RELEASING.md).

---

## Contributing

This is a proprietary codebase and external contributions are not accepted. For
the working team, [CONTRIBUTING.md](CONTRIBUTING.md) covers branch naming,
commit conventions, the pull request checklist, and the rules that protect the
extension's privacy posture.

---

## Release history

| Version | Date | Notes |
|---|---|---|
| 0.0.1 | October 4, 2023 | Initial Chrome Web Store release. Domain–body correlation analysis and real-time alerts. |

Full detail in [CHANGELOG.md](CHANGELOG.md).

---

## Support

- **Bugs and feature requests:** open an [issue](https://github.com/Chrisb1368/domain-content-validator-chrome-extension/issues)
- **Security or privacy reports:** see [SECURITY.md](SECURITY.md) — do not open a public issue
- **Store listing contact:** montageapplication@gmail.com
- **Data handling:** see [PRIVACY.md](PRIVACY.md)

---

## Maintainers

| Role | Who |
|---|---|
| Owner & product | Christopher G. Benavides ([@Chrisb1368](https://github.com/Chrisb1368)) |

---

## License

Copyright © 2023–2026 Christopher G. Benavides. All rights reserved.

This source is published for visibility and collaboration. It is **not** open
source: no license to use, copy, modify, or distribute this code is granted. See
[LICENSE](LICENSE) for the full terms.

---

## Further reading

| Document | What is in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Module responsibilities, lifecycle, message flow |
| [docs/DETECTION.md](docs/DETECTION.md) | The heuristic line by line, and how it fails |
| [docs/RELEASING.md](docs/RELEASING.md) | Packaging and store submission runbook |
| [docs/STORE_LISTING.md](docs/STORE_LISTING.md) | Canonical copy of the store listing |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to work in this repository |
| [PRIVACY.md](PRIVACY.md) | Data handling commitments |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

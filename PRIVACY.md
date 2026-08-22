# Privacy and data handling

Domain-Content Validator reads email. That makes trustworthiness a product
requirement, not a nice-to-have. The Chrome Web Store listing declares that the
extension **does not collect user data**, and this document records what that
commitment means in the code as shipped.

- **Published privacy policy:** https://www.timemotionstudy.com/private-policy
- **Store disclosure:** "The developer has disclosed that it will not collect or use your data."

---

## What the store listing declares

> This developer declares that your data is:
>
> - Not being sold to third parties, outside of the approved use cases
> - Not being used or transferred for purposes that are unrelated to the item's core functionality
> - Not being used or transferred to determine creditworthiness or for lending purposes

---

## What the code actually does

### Message content is read, used, and discarded

`content.js` reads the sender element and the message body out of the Gmail DOM,
compares them, and produces a three-state verdict. The content itself never
leaves the page context — the only thing sent to the service worker is:

```js
{ save: true, suspicious: "sus" | "not" | false, path: "<gmail message id>" }
```

No subject, no body, no sender address.

### Two values are stored, in session storage only

| Key | Value | Lifetime |
|---|---|---|
| `suspicious` | `"sus"`, `"not"`, or `false` | Cleared when the browser closes |
| `urlPath` | The Gmail message id from the URL fragment | Cleared when the browser closes |

Both live in `chrome.storage.session`, which Chrome keeps in memory and never
writes to disk. `urlPath` is an opaque Gmail conversation id used to tell whether
the user has navigated to a different message; it is not tied to an account and
is not message content, but it is the one value derived from the user's mail
that is retained at all, so it is worth naming explicitly.

Nothing is written to `chrome.storage.local` or `sync`.

### No network requests from the extension logic

There is no server, no API key, no endpoint, no analytics SDK, no crash
reporter, and no telemetry ping. The extension declares no `host_permissions`
and never calls `fetch`.

### One outbound request that should be removed

`popup/index.html` links Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Dongle&display=swap" rel="stylesheet">
```

Opening the popup therefore makes a request to `fonts.googleapis.com`, which
reveals to Google that the popup was opened (IP address and user agent). **No
message data is involved**, but it is still an outbound request from an extension
that advertises collecting no data. Self-hosting the font, or dropping it, is on
the [roadmap](README.md#roadmap) and is the right fix.

---

## What is deliberately not done

- No message content in storage, ever
- No message content in any network request — there are none
- No profile, identifier, or account linkage
- No advertising, and no use for creditworthiness or lending decisions
- No remotely hosted code, as Manifest V3 requires

---

## Changes that require sign-off before merging

Each of the following changes the extension's privacy posture and requires
updating both the store's data-safety declarations and the published privacy
policy:

- Adding `fetch`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon`
- Adding a remote script, stylesheet, font, or image
- Writing any part of a message to `chrome.storage`
- Switching `chrome.storage.session` to `local` or `sync`
- Adding a permission — especially `history`, `cookies`, `webRequest`, or
  `identity`
- Broadening `content_scripts.matches` or adding `host_permissions`
- Adding any third-party dependency

The pull request template asks about each of these. Answer honestly — a
mismatch between the code and the store declarations is a policy violation, not
a review nitpick.

---

## Reporting a privacy concern

Email **montageapplication@gmail.com**. See [SECURITY.md](SECURITY.md) for how
sensitive reports are handled.

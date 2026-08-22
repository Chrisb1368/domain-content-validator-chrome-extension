# How detection works

This document walks through `content.js` as it is actually written in 0.0.1,
then states plainly where the heuristic is strong and where it breaks. If you
are changing detection, read this first — most "obvious" improvements interact
with one of the constraints below.

---

## The check, step by step

### 1. Is this an open Gmail message?

```js
if (!url.includes("https://mail.google.com/")) return false;
if (url.includes("https://mail.google.com/") && url.split("#")[1].split("/").length == 1) return false;
```

Two gates. The first restricts DCV to Gmail on the web. The second looks at the
URL fragment: Gmail encodes the view there, so `#inbox` (one segment) is a list
and `#inbox/FMfcgz...` (two segments) is an open message. Only the second is
worth evaluating.

Returning `false` — rather than `"not"` — matters: the popup renders `false` as
**No Email Detected** instead of claiming the message is safe.

### 2. Find the sender

```js
let from = document.querySelector(".go");
if (!from) return "sus";
```

`.go` is the Gmail element holding the sender's address, typically rendered as
`<name@example.com>`. If it is missing, the check **fails closed** — it returns
`"sus"` rather than assuming safety. That is the right default for a security
tool, but it also means a Gmail markup change turns DCV into a false-positive
generator rather than silently doing nothing.

### 3. Extract the domain's first label

```js
let domain = from.innerText.split(/[@></,]/).reverse()[1].split(".")[0];
```

Reading it inside out:

| Step | On `<billing@paypal.com>` |
|---|---|
| `split(/[@></,]/)` | `["", "", "billing", "paypal.com", "", ""]` |
| `.reverse()` | `["", "", "paypal.com", "billing", "", ""]` |
| `[1]` | `"paypal.com"` |
| `.split(".")[0]` | `"paypal"` |

Splitting on `@ > < / ,` strips the angle brackets Gmail renders around the
address and separates local part from domain. Taking `[1]` after reversing skips
the trailing empty string. The final `.split(".")[0]` drops the TLD so
`paypal.com` and `paypal.co.uk` both reduce to `paypal`.

### 4. Look for the domain in the body

```js
let regexp = new RegExp(domain, "gi");
if ([...document.querySelector(".a3s").innerHTML.matchAll(regexp)].length >= 1) return "not";
else return "sus";
```

`.a3s` is the message body container. The domain label is searched for
case-insensitively across the body's **HTML** — not just visible text, so link
`href`s, `alt` text, and inline styles all count as matches.

One or more occurrences → `"not"`. Zero → `"sus"`.

### 5. Report and warn

```js
if (document.body.textContent.length < 1000) return 0;
...
chrome.runtime.sendMessage({ save: true, suspicious: result, path: hash ? hash.split("?")[0] : "" });
if (result == "sus") alert(msg);
```

The length gate keeps DCV from evaluating a half-rendered page. The verdict goes
to the background worker for the popup to display, and `"sus"` additionally
raises a blocking `alert()`.

### 6. Knowing when to run

Gmail never reloads the page, so there is no natural trigger. `background.js`
sends `{ exe: true }` on `chrome.tabs.onUpdated` (status `complete`) and on
`chrome.tabs.onActivated`; `content.js` responds by polling every 2 seconds
until the body exceeds 1000 characters, then runs once.

The stored `urlPath` is what prevents re-alerting on the same message: if the
new tab URL still contains the stored message id, no `{ exe: true }` is sent.

---

## Why this heuristic works at all

Legitimate bulk mail is full of self-references: the sending domain appears in
unsubscribe links, tracking URLs, logo image paths, footer addresses, and
"view in browser" links. Phishing mail sent from a throwaway domain has none of
those, because the body impersonates *someone else*. The asymmetry is real, and
it costs one DOM query and one regex to exploit.

---

## Where it breaks

### False negatives (a bad message is called safe)

- **A single mention flips the verdict.** An attacker who writes the target
  domain once anywhere in the body — even inside an invisible element — is
  scored safe.
- **Matching against HTML, not text.** Hidden markup counts, which widens the
  attack surface for the point above.
- **Lookalike domains pass.** `paypa1.com` reduces to `paypa1`; if the body says
  `paypa1.com` anywhere, the check agrees with itself and returns `"not"`.
- **Only the first label is used.** `paypal.evil.com` reduces to `paypal`, which
  a body about PayPal will happily match.

### False positives (a good message is flagged)

- **Personal mail.** A message from a colleague at `gmail.com` that never says
  "gmail" is flagged. This is the most common complaint and is inherent to the
  approach — the heuristic assumes commercial mail patterns.
- **Missing `.go`.** Any Gmail layout in which the sender element is absent —
  conversation view variants, certain threads — returns `"sus"` for every
  message.
- **Short domain labels.** A two- or three-letter label will match inside
  unrelated words.

### Crashes and undefined behavior

- `url.split("#")[1]` throws a `TypeError` on a `mail.google.com` URL with no
  fragment.
- `document.querySelector(".a3s")` is not null-checked; a message pane without
  it throws.
- `new RegExp(domain, "gi")` is built from page text. A domain containing regex
  metacharacters yields a wrong pattern or throws.

---

## Improving it without breaking it

Suggested order, cheapest and safest first:

1. **Guard the crashes.** Null-check `.a3s`, escape the regex source, and handle
   a missing fragment. Pure robustness, no behavior change.
2. **Match visible text, not HTML.** Use `innerText` on `.a3s`. This closes the
   hidden-markup bypass and should not affect legitimate mail, which mentions
   its domain in visible copy too.
3. **Count instead of testing.** Return the number of occurrences and their
   context (visible text vs. link target). Two mentions in link `href`s is much
   stronger evidence than one in body copy.
4. **Add independent signals.** Urgency phrasing, credential and payment
   requests, and links whose display text disagrees with their target are
   orthogonal to the domain check and each catch cases it misses.
5. **Score, do not decide.** Combine signals into a number with two thresholds —
   caution and danger — so the UI can distinguish "unusual" from "almost
   certainly phishing" rather than showing one blunt alert.
6. **Only then, add clients.** Extract the DOM reads behind a per-provider
   adapter so Outlook and Yahoo are a selector table rather than a rewrite.

Keep detection logic free of `chrome.*` calls and DOM access where you can. A
pure function that takes `{ sender, body, links }` and returns a verdict is
testable in Node; the current inline version can only be tested by hand in
Gmail.

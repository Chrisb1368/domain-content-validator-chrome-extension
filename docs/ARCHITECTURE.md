# Architecture

Domain-Content Validator is a Manifest V3 extension with three cooperating
contexts and no build step. Each file below is shipped verbatim to users.

```
┌───────────────────────────────────────────────────────────────────┐
│ Browser                                                           │
│                                                                   │
│  ┌──────────────────────┐        ┌────────────────────────────┐   │
│  │ Gmail tab            │        │ Service worker             │   │
│  │  content.js          │◄──────►│  background.js             │   │
│  │  • DOM reads         │  msg   │  • tab events              │   │
│  │  • alert()           │        │  • writes session storage  │   │
│  └──────────────────────┘        └─────────────┬──────────────┘   │
│                                                │                  │
│                                   chrome.storage.session          │
│                                                │                  │
│                                  ┌─────────────▼──────────────┐   │
│                                  │ Toolbar popup              │   │
│                                  │  popup/index.html + script │   │
│                                  │  • renders the verdict     │   │
│                                  └────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Contexts and responsibilities

### `background.js` — service worker

The coordinator. It has no DOM and, under MV3, **no durable memory**: Chrome
tears the worker down when idle and restarts it on the next event. Anything that
must survive that goes into `chrome.storage.session`.

| Listener | Responsibility |
|---|---|
| `chrome.runtime.onMessage` | On `{ save: true, ... }`, persist `{ suspicious, urlPath }` to session storage |
| `chrome.tabs.onUpdated` | When a tab finishes loading, compare its URL to the stored `urlPath`; if the message changed, send `{ exe: true }` |
| `chrome.tabs.onActivated` | Send `{ exe: true }` when the user switches tabs |

The listener returns `true` to keep the message channel open for an
asynchronous response — required whenever a handler awaits.

### `content.js` — page context

The only code with access to the Gmail DOM, and therefore the only code that can
see message content. It is injected on every page (`<all_urls>`) but exits
immediately unless the URL is an open Gmail message.

Responsibilities: wait for the SPA to render, read the sender and body, decide,
report the verdict, and raise the alert. See [DETECTION.md](DETECTION.md) for
the decision itself.

### `popup/` — toolbar UI

A view with no logic of its own. `script.js` reads `suspicious` from session
storage, selects one of three states, and writes an SVG icon, a heading, and a
message into `#icon-sec`, `#heading`, and `#msg`. A `chrome.storage.onChanged`
listener re-renders so an open popup updates live.

---

## State

| Where | Key | Lifetime | Contents |
|---|---|---|---|
| `chrome.storage.session` | `suspicious` | Until the browser closes | `"sus"`, `"not"`, or `false` |
| `chrome.storage.session` | `urlPath` | Until the browser closes | Gmail message id from the URL fragment |
| `content.js` (in memory) | `inter` | Until the page unloads | Handle for the render-polling interval |

Session storage — not `local` — is deliberate: the verdict is meaningless after
the browser restarts, and not persisting it keeps the extension's data footprint
at zero on disk.

---

## Lifecycle of one evaluation

1. User opens or switches to a Gmail tab.
2. `background.js` sends `{ exe: true }` to that tab.
3. `content.js` clears any pending interval and starts a new 2-second poll.
4. Once `document.body.textContent.length > 1000`, the poll stops and `main()`
   runs.
5. `main()` calls `validate()`, sends `{ save: true, suspicious, path }` to the
   background worker, and — if the result is `"sus"` — raises `alert()`.
6. `background.js` writes the verdict to session storage.
7. Any open popup re-renders via `chrome.storage.onChanged`; a popup opened
   later reads the same value on load.

`clearInterval(inter)` at the start of step 3 is what stops overlapping polls
when several `{ exe: true }` messages arrive in quick succession — a common case
when a tab both finishes loading and becomes active.

---

## Invariants worth preserving

- **Detection stays in the page context.** The service worker must never receive
  message bodies; it only receives a three-state verdict and a message id.
- **No durable storage of message data.** Session storage only, and only the two
  keys above.
- **No network calls, anywhere.** See [PRIVACY.md](../PRIVACY.md).
- **The repository root is the extension root.** `manifest.json` at the top,
  every referenced path relative to it, no build output directory.
- **Fail closed.** When the DOM cannot be read, prefer flagging over staying
  silent — but pair that with a plan for markup drift, because failing closed at
  scale means alerting on everything.

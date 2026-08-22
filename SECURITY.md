# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 0.0.1 (current store release) | ✅ |
| Unreleased `main` | ✅ |
| Anything older | ❌ |

The extension auto-updates through the Chrome Web Store, so only the latest
published version is supported. If you are running an unpacked development
build, update to current `main` before reporting.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Email **montageapplication@gmail.com** with:

1. What the issue is and why it matters
2. Steps to reproduce — ideally a sample message that triggers it
3. Extension version and Chrome version
4. Screenshots or console output if relevant
5. A suggested fix, if you have one

Expect an acknowledgement within a few days. Please allow time for a fix to ship
and propagate through store review before disclosing publicly — store review
alone typically takes several days.

## In scope

This is a security tool, so its failure modes are unusual. All of the following
are real vulnerabilities here:

- **Alert suppression.** Anything a sender can put in a message that prevents the
  warning from firing — content that keeps the page under the 1000-character
  render gate, markup that hides or removes the sender element in a way that
  changes the verdict, or timing that causes `main()` to run against a stale DOM.
- **Detection bypass.** A general, repeatable technique that makes a phishing
  message score `"not"`. Hidden markup containing the impersonated domain is the
  known example — see [docs/DETECTION.md](docs/DETECTION.md#where-it-breaks).
- **Data leakage.** Any path by which message content reaches storage, the
  network, another extension, or a page script.
- **Content injection.** The popup builds its icon with `innerHTML` from static
  strings. Anything that lets message-derived text reach an `innerHTML` sink, in
  the popup or the page, is serious.
- **Privilege issues.** Anything causing the extension to act outside its
  declared permissions, or to expose an API to page scripts.
- **Denial of service.** A message that makes the content script's 2-second
  polling loop run forever or hang the tab.

## Out of scope

- A single hand-crafted message that evades detection. Detection is heuristic and
  its limits are documented; open a regular issue with the sample instead.
- False positives on personal mail. This is a known property of the approach —
  see [docs/DETECTION.md](docs/DETECTION.md).
- Vulnerabilities in Gmail itself. Report those to Google.
- Social-engineering attacks that do not involve the extension.

## Design commitments

These properties should hold in every release. A change that breaks one is a
security regression, not a feature:

- The extension makes **no network requests** from its detection or background
  logic. (The popup's Google Fonts link is a known exception and is scheduled for
  removal — see [PRIVACY.md](PRIVACY.md).)
- Message content is **never persisted**.
- Message-derived text is **never** assigned to `innerHTML`.
- The extension requests the **narrowest permissions** that make it work.
- When the DOM cannot be read, detection **fails closed** — it warns rather than
  staying silent.

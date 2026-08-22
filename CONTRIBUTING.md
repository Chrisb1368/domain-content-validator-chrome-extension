# Contributing

This is a proprietary codebase (see [LICENSE](LICENSE)) and external
contributions are not accepted. This guide is for the working team.

---

## Getting set up

```bash
git clone https://github.com/Chrisb1368/domain-content-validator-chrome-extension.git
cd domain-content-validator-chrome-extension
```

Add `assets/logo1.png` (see [assets/README.md](assets/README.md)), then load the
folder unpacked at `chrome://extensions` with **Developer mode** on. There is no
build step and no dependencies to install — what is in the repository is what
ships.

## Branches

- `main` always reflects something that could ship. Do not commit to it
  directly.
- Branch names: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`,
  `docs/<short-name>`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`chore:`, `docs:`, `refactor:`, `test:`, `perf:`.

Write the subject as an instruction — "fix: guard missing message body" rather
than "fixed a bug". Keep unrelated changes in separate commits; a detection
change and a doc rewrite in one commit are hard to revert independently.

## Code style

The codebase is plain ES2020 with no transpilation, no bundler, and no
framework. Match what is there:

- 2-space indentation, semicolons, double quotes in existing files
- `const` by default, `let` when reassigned, never `var`
- Small named functions over long inline blocks
- User-visible strings as constants near the top of their module
- No dependencies. Adding one changes the review surface and the package size,
  and must be discussed first.

## Things that are not negotiable

These protect the extension's store listing and its users. A pull request that
does any of them needs the owner's sign-off **before** review, not after:

- Adding a network call of any kind (`fetch`, `XMLHttpRequest`, `WebSocket`,
  `sendBeacon`, a remote script, stylesheet, or font)
- Storing any part of a message — sender, subject, body — anywhere
- Adding a permission, or broadening `content_scripts.matches` /
  `host_permissions`
- Adding an analytics, telemetry, or crash-reporting dependency

See [PRIVACY.md](PRIVACY.md) for why.

## Testing a change

There is no automated test suite yet — detection reads live Gmail markup, which
does not fixture well. Until detection is extracted into a pure module, verify
by hand:

| Scenario | Expected |
|---|---|
| Legitimate message whose sender domain appears in the body | ✅ Safe Email Detected, no alert |
| Message from a domain never mentioned in the body | ❌ Potential Fraud Alert! + alert dialog |
| Inbox list, no message open | No Email Detected, no alert |
| Switch away and back to the Gmail tab | Verdict re-evaluates |
| Any non-Gmail page | Nothing happens, no alert |
| Reload the extension, reopen the popup | Popup state matches the open message |

Check the service worker console (`chrome://extensions` → **Service worker**) and
the page console for errors in every scenario, not just the failing one.

## Pull requests

Describe what changed and why. Include:

- The scenarios above that you re-ran, and their results
- Before/after screenshots for anything user-visible
- An explicit note about permissions, storage, or network behavior — even if the
  answer is "none of these changed"

### Checklist

- [ ] Loads unpacked with no errors on the extension card
- [ ] Service worker and page consoles are clean
- [ ] All six test scenarios above pass
- [ ] No new permissions, and `matches` is no broader than before
- [ ] No message content written to storage or sent over the network
- [ ] No new dependency, remote script, stylesheet, or font
- [ ] `manifest.json` still valid JSON and the extension still zips with
      `manifest.json` at the archive root
- [ ] Docs updated — README, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
      [docs/DETECTION.md](docs/DETECTION.md), or
      [docs/STORE_LISTING.md](docs/STORE_LISTING.md) — if behavior, structure,
      permissions, or listing copy changed
- [ ] [CHANGELOG.md](CHANGELOG.md) Unreleased section updated

## Reporting problems

- Security or privacy issues: **do not open an issue.** Follow
  [SECURITY.md](SECURITY.md).
- Everything else: open an issue using one of the templates. For a wrong
  verdict, the **false positive / negative** template asks for the details that
  actually make it reproducible.

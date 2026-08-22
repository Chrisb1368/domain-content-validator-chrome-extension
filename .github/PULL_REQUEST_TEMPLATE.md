## What changed

<!-- One or two sentences. What does this do, and why now? -->

## Why

<!-- The problem this solves. Link an issue if there is one. -->

Closes #

## How it was tested

Chrome version:
Gmail layout (standard / conversation view):

| Scenario | Result |
|---|---|
| Legitimate message whose sender domain appears in the body | |
| Message from a domain never mentioned in the body | |
| Inbox list, no message open | |
| Switch away from and back to the Gmail tab | |
| Non-Gmail page | |
| Reload extension, reopen popup | |

Service worker console clean? <!-- yes / no + what appeared -->
Page console clean? <!-- yes / no + what appeared -->

## Screenshots

<!-- Before/after for anything user-visible. Delete if not applicable. -->

## Permissions, storage, and network

Answer all four, even when the answer is "no change".

- **Permissions changed?**
- **`content_scripts.matches` or `host_permissions` changed?**
- **Anything new written to storage?**
- **Any new network request, remote script, stylesheet, or font?**

> If any answer is yes, this needs owner sign-off before review and probably an
> update to the store's data-safety declarations. See
> [PRIVACY.md](../PRIVACY.md).

## Checklist

- [ ] Loads unpacked with no errors on the extension card
- [ ] All six scenarios above pass
- [ ] No message content written to storage or sent over the network
- [ ] No new dependency
- [ ] `manifest.json` is valid JSON and every path it references exists
- [ ] Docs updated (README / `docs/ARCHITECTURE.md` / `docs/DETECTION.md` / `docs/STORE_LISTING.md`) if behavior, structure, permissions, or listing copy changed
- [ ] `CHANGELOG.md` Unreleased section updated

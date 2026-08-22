# Changelog

All notable changes to Domain-Content Validator are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The Chrome Web Store requires every uploaded package to carry a strictly higher
`version` than the one currently published, so versions here always move forward
and are never reused.

## [Unreleased]

### Added

- This repository. The shipped 0.0.1 extension source is now under version
  control: `manifest.json`, `background.js`, `content.js`, and `popup/`.
- Documentation set — README, contributing guide, architecture notes, a
  line-by-line walkthrough of the detection heuristic, a release runbook, a
  version-controlled copy of the store listing, and privacy and security
  policies.
- Issue and pull request templates, CODEOWNERS, and a CI workflow that validates
  `manifest.json` and checks that referenced files exist.

### Known issues carried over from 0.0.1

Documented rather than fixed, so they can be scheduled. Full detail in the
README's [known limitations](README.md#known-limitations--cleanup-backlog).

- `assets/logo1.png` is referenced by the manifest but not present in the
  repository; the extension will not load unpacked until it is added.
- `content_scripts.matches` is `<all_urls>` although detection only runs on
  Gmail.
- `background.matches` is not a valid Manifest V3 key and is ignored by Chrome.
- `popup/index.html` carries a leftover `Controller Mapper` title and meta
  description, and loads a font from `fonts.googleapis.com`.
- `popup/script.js` contains an unused copy of `getTabURL()` and `validate()`.
- `url.split("#")[1]` throws on a `mail.google.com` URL with no fragment, and
  the detection regex is built from unescaped page text.

## [0.0.1] — 2023-10-04

### Added

- Initial Chrome Web Store release.
- Domain–body correlation analysis: cross-checks the content of an email against
  the sender's domain to identify inconsistencies.
- Real-time alerts: warns the reader immediately when a suspicious message is
  detected, with an explanation of why it was flagged.
- Toolbar popup showing the verdict for the message currently in view.
- Local-only processing — no email content stored or shared externally.

[Unreleased]: https://github.com/Chrisb1368/domain-content-validator-chrome-extension/compare/v0.0.1...HEAD
[0.0.1]: https://chromewebstore.google.com/detail/domain-content-validator/jagbdijnbgbohlggdnacpdlbnmmplkpl

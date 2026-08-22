---
name: False positive / false negative
about: A message was flagged that should not have been, or was not flagged when it should have been
title: ''
labels: detection
assignees: ''
---

<!--
Do NOT paste real message content or personal information.
Describe the shape of the message instead — that is what makes it reproducible.
-->

## Which way did it go wrong

- [ ] **False positive** — a legitimate message was flagged as suspicious
- [ ] **False negative** — a phishing or suspicious message was not flagged

## Message shape

- Sender domain (or a stand-in of the same shape, e.g. `example-billing.com`):
- Does the body mention that domain anywhere?
- Does the body mention it only inside links or hidden markup?
- Is it bulk/commercial mail, or personal mail from an individual?
- Does the body contain a lookalike of another brand's domain?

## What the popup said

- [ ] ❌ Potential Fraud Alert!
- [ ] ✅ Safe Email Detected
- [ ] ✅ No Email Detected

Did the `alert()` dialog appear?

## Environment

- Extension version:
- Chrome version:
- Gmail layout: <!-- standard inbox / conversation view / split pane -->

## Anything else

<!--
Known limitations are documented in docs/DETECTION.md — worth a look first.
Personal mail that never mentions the sender's domain is a known false-positive
class, but please still report it: volume tells us how much it matters.
-->

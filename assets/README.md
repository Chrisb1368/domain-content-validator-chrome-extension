# assets

## `logo1.png` — required, not yet committed

`manifest.json` references `./assets/logo1.png` for every icon size:

```jsonc
"icons":  { "16": "./assets/logo1.png", "32": "...", "64": "...", "128": "..." },
"action": { "default_icon": { "16": "./assets/logo1.png", ... } }
```

Chrome refuses to load an unpacked extension whose icon files are missing, so
**this file must be added before the repository can be loaded or packaged.**
Copy it from the published 0.0.1 package rather than recreating it — a different
icon would change the store listing's appearance on the next upload.

## Improving the icon setup

The manifest currently points all four sizes at one image, so Chrome downscales
a single asset everywhere. Shipping properly sized files is a small win in
sharpness, especially at 16px in the toolbar:

| File | Size | Used for |
|---|---|---|
| `logo-16.png` | 16×16 | Favicon-scale UI |
| `logo-32.png` | 32×32 | Windows toolbar at higher DPI |
| `logo-48.png` | 48×48 | Extensions management page |
| `logo-128.png` | 128×128 | Installation and the store listing |

If you do this, update both the `icons` and `action.default_icon` blocks in
`manifest.json` in the same commit.

## Store assets

Promotional images live on the store listing, not in the extension package. Keep
their sources here so they are versioned alongside the code:

| Asset | Required size |
|---|---|
| Store icon | 128×128 |
| Screenshot | 1280×800 or 640×400 |
| Small promo tile | 440×280 |
| Marquee promo tile | 1400×560 |

Keep the full-resolution originals outside the extension package — they count
against the uploaded zip size for no benefit.

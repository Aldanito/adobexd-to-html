# Contributing

## Setup

```bash
npm install
npm test
```

`npm test` exports `examples/sample.xd` and checks HTML wrap vs gold SVG.

## Layout

- `cli/` — parse `.xd`, Scenegraph SVG emit, fidelity bench
- `exporter/` — HTML documents and CSS sheet
- `examples/sample.xd` — tiny public fixture for CI
- `examples/dashboard.xd` — public Pages / screenshot demo
- Visibility rules belong in `cli/pipeline/`, not in `convertNode`

## Pull requests

1. Run `npm test` (and `npm run bench` if you change SVG emit).
2. Keep the default export path Scenegraph SVG, not CSS boxes.
3. HTML wrap vs gold stays the CI gate; `react/*.jsx` is additive.
4. Do not commit private `design/` files or `export-out*`. Keep demos under `examples/`.

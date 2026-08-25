# Adobe XD → HTML/CSS

**Version:** 1.5.5  
**Last Updated:** 2026-08-25

Export Adobe XD documents to 1:1 HTML/CSS via a **CLI proxy** (parses `.xd` directly) or the optional UXP plugin. Also extracts categorized **assets**.

## CLI

```bash
node ./bin/xd-to-html.js "./design/Your File.xd" -o ./export-out
```

Requires **Node.js 18+** and system `unzip`.

### Output layout

```
index.html                      # Artboards + assets
artboards/<slug>.html           # One page per artboard
styles/export.css               # Shared CSS
assets/images/*                 # Bitmaps used on artboards
assets/icons/*                  # Icon slot
```

## Fidelity rules (any `.xd`)

Export aims for **1:1 with the Scenegraph in the file**, not with screenshots from a newer app build.

| Rule | Behavior |
|------|----------|
| Positioning | Nested transforms accumulate parent-relative (SVG group translates). Rotated groups keep CSS `matrix()`. Top-level may be pasteboard-global. Centered area text uses the text frame (labels under sidebar icons, dates in fields). Overlay letter + stem groups emit one wordmark. Pasteboard notes that only graze the artboard are omitted. |
| Default artboard UI | Full Scenegraph, matching design SVG exports (open menus and search fields included) |
| Alternate states | Optional `hideOverlays` plan pass can keep one occupant per origin; off by default so HTML matches the SVG |
| Detection | Structure-first (option lists, dialog actions, field-row geometry) — not product-specific copy |

Heuristics are intentionally generic so the same pipeline works across projects. Edge cases in a specific file should be fixed by tightening **structure** rules, not by hardcoding that file’s labels.

## Pipeline architecture

Artboard export is two passes so a visibility tweak cannot crush unrelated fields during HTML emit. Overlay stripping (`hideOverlays`) is **off** by default so pages match design SVG exports.

```
.xd / AGC
  → parse-xd
  → planVisible   (cli/pipeline/)  skip set: overlays + one occupant per slot
  → convertNode   (emit only)      position, hoist, icon SVG, HTML/CSS
  → documents     HTML pages
```

| Pass | Module | Responsibility |
|------|--------|----------------|
| 1 | `pipeline/plan-visible.js` | Open menus, edit-rows, popover chrome, date-picker occlusion |
| 1 | `pipeline/slot-claim.js` | Same-origin field slot (±6px); higher score replaces |
| 1 | `pipeline/slot-score.js` | 0 open-menu, 1 Select All, 2 closed field, 3 concrete value |
| 2 | `agc-convert.js` | Emit skipped nodes as empty; no occupancy side effects |

Do not add skip/occupancy logic inside `convertNode`. Put it in the plan pass.

## UXP plugin (optional)

Adobe XD → **Plugins → Development → Load Plugin…** → this folder → **Export to HTML**.

## Known limits

- **Design file drift:** The published Adobe XD share link may be a **newer** document than `design/*.xd` on disk. Overlay letter + remainder groups (e.g. `C` + `ounsel lock`) are composed into one wordmark so the header matches the intended brand.
- **Symbols / components:** expanded as groups; no interactive component states.
- **Boolean ops / complex paths:** inline SVG path approximations.
- **Multi-range text:** dominant (first) style range is applied.
- **Prototypes:** interactions / Auto-Animate out of scope.

## Changelog

### 1.5.5 — 2026-08-25

1. Rotated groups keep their matrix (eraser on the edit-invoice toolbar) instead of hoisting children unrotated onto the PIN icon.

### 1.5.4 — 2026-08-25

1. Pasteboard spec notes that only graze the artboard are omitted so they no longer cover the header.

### 1.5.3 — 2026-08-25

1. Open menus keep stacked item leading and per-line fill so Section Edits highlights Merge Section instead of covering it.
2. Stroke icons (chevrons, clear X) emit as SVG lines instead of filled boxes.

### 1.5.2 — 2026-08-25

1. Export no longer writes a component library (`components/` pages and index links).

### 1.5.1 — 2026-08-25

1. Overlay-letter wordmarks (`C` + lowercase stem) emit as one string so Counsel Clock is readable instead of stacked glyphs.

### 1.5.0 — 2026-08-25

1. Centered area text uses the XD frame so sidebar labels sit under icons, letterhead/footer center on the page, and calendar dates/buttons stay in their fields.
2. Wordmark line-height ignores oversized area-box leading so Counsel Clock `C`s align with `ounsel lock`; serif stacks fall back to Georgia.
3. Icon groups whose path `d` shares one local space are emitted without collapsing; date-picker leftover scrollbar rects are omitted.

### 1.4.9 — 2026-08-25

1. Centered text sits on the glyph origin (`line.x`) instead of shifting by half the text frame.

### 1.4.8 — 2026-08-25

1. Nested AGC transforms without treating large `tx` as artboard-absolute (Version History, Invoice No., field row).
2. Artboard HTML keeps Scenegraph/SVG-visible open menus and search fields (no overlay strip).

### 1.4.7 — 2026-08-25

1. Split export into plan (visibility) then emit so occupancy cannot crush other fields.
2. Same-origin slots keep one label: values over placeholders, closed fields over menu options.
3. Adjacent header actions remain independent (origin gap > 6px).

### 1.4.6 — 2026-08-25

1. Occupancy no longer merges different labels that share a slot (Select Client, Preview Draft, Search).
2. Centered/right XD text uses the anchor origin (`translateX(-50%)` / `-100%`).
3. Font weight, line-height, and centered stroke match the Scenegraph; SVG reset no longer shrinks icons.
4. Overlay text scans are indexed once per artboard (linear instead of O(n²)).
5. Drop ungrouped popover path/rect chrome so leftover beige menus do not cover fields.

### 1.4.5 — 2026-08-25

1. Date-range pickers occlude ungrouped open-menu chrome underneath (fixes beige leftovers on calendar screens).
2. Header occupancy uses wider X bands so stacked alternate actions collapse to one visible label.
3. Detect open searchable dropdowns (`Search By…` + options); keep closed triggers only.
4. Document that online XD share links can diverge from the local `.xd` file.

### 1.4.4 — 2026-08-25

1. Keep date-range / calendar popovers (not treated as disposable overlays).
2. Header mask / icon sizing fixes carried forward.

### 1.4.3 — 2026-08-25

1. Header: collapse alternate action-button states; dedupe header icons.
2. Mask groups sized to the clip rect with overflow (fixes clipped header logo).

### 1.4.2 — 2026-08-25

1. Icon detection ignores groups that contain text (fixes missing Version History / buttons).
2. Mixed overlays keep calendar and other non-menu text; only open-menu copy is stripped.
3. Occupancy tightened to near-exact overlaps so artboard pages match XD visible layers.

### 1.4.1 — 2026-08-25

1. Mixed open menus: keep closed triggers only; drop leftover panel chrome shapes.
2. Text alternate-states: plan/emit pass prefers values over placeholders in the same slot.
3. Softened table banding so real rows are not destroyed.

### 1.4.0 — 2026-08-25

1. Generalized overlay filtering (structure over project-specific labels) for consistent artboards on any `.xd`.
2. Mixed closed-trigger + open-menu groups keep the trigger; open options are stripped.
3. Summary chrome and table slots dedupe alternate states without hardcoded column titles.

### 1.3.0 — 2026-08-25

1. Sidebar/header icons: multi-path groups exported as one SVG; mask clip-path support.
2. Dropdowns: open menus stripped from artboards (kept under `components/`); closed labels marked.
3. Tables: edit-row overlays skipped; header/body cell slot dedupe for cleaner columns.

### 1.2.0 — 2026-08-25

1. Fixed artboard-local positioning (negative pasteboard origins, nested transforms).
2. Clip pasteboard outliers; fix CSS tokens so `left`/`top` are never replaced by color vars.
3. Export component library pages under `components/<type>/` plus categorized assets.

### 1.1.0 — 2026-08-25

1. CLI proxy parsing `.xd` / AGC without Adobe XD.

### 1.0.0 — 2026-08-25

1. Initial UXP plugin export pipeline.

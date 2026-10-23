# pen.dev canvas work

pen.dev is a live infinite-canvas design editor. In this session its tools are exposed as
`mcp__pen__browser`, `mcp__pen__execute`, `mcp__pen__get_app_state`, `mcp__pen__get_style`,
and `mcp__pen__read_skill`. The user is watching the canvas, so treat every write as visible work.

## Before touching anything

1. `mcp__pen__get_app_state` (no arguments). It returns the **active document path**, the current
   selection, top-level frames, reusable components, and the integrated browser state.
2. `mcp__pen__read_skill` with a `path` — it returns pen.dev's own authoritative documentation. Do
   not guess the `execute` API or the `.pen` schema when this call can tell you. Read
   `execute.md` before the first `execute` call of a session.

## Tool inputs you must supply

| Tool | Arguments |
| --- | --- |
| `get_app_state` | none |
| `get_style` | optional `name`, `params` |
| `read_skill` | `path` — see the index below |
| `execute` | `filePath` (the active document path from `get_app_state`) + `input` (JavaScript) |
| `browser` | `filePath` + `action` (`load-page`, `import-to-canvas`, `screenshot-to-canvas`, `return-element`, `return-screenshot`, `cdp`, …), plus `url` / `querySelector` / `target` / `method` / `params` as that action needs |

## read_skill index

| `path` | What it covers |
| --- | --- |
| `SKILL.md` | Overview of the whole pen.dev design workflow |
| `execute.md` | The `execute` JavaScript API — read before your first `execute` |
| `pen-schema.md` | `.pen` document schema (nodes, themes, variables) |
| `generate.md` | `Generate()` for AI-generated and stock imagery |
| `scripts-and-shaders.md` | `script` node and shader/effect usage |
| `whiteboard.md` | Whiteboards and information-first deliverables |
| `guide/design-system.md` | Composing screens from components and tokens |
| `guide/components.md` | Component and variant patterns |
| `guide/code.md` | Mapping designs to code structure |
| `guide/landing-page.md` | Landing page composition |
| `guide/mobile-app.md` | Mobile app screens |
| `guide/slides.md` | Slide decks |
| `guide/table.md` | Table and data layouts |
| `guide/tailwind.md` | Tailwind-oriented layout and spacing |

`read_skill` returns empty content for an unknown path — it does not raise an error. If a document
comes back empty, the path is wrong; check this table instead of retrying blindly. Large documents
(`execute.md`, `SKILL.md`, `pen-schema.md`) can take 10–30 s to arrive.

## Rules

- `.pen` files are encrypted. Never open them with filesystem tools, `read`, `grep`, or a shell;
  only the MCP tools can read or write them.
- `execute` mutates the canvas the user is looking at. State what you are about to change, and ask
  first for destructive edits (deleting frames, renaming shared components, bulk restyling).
- Prefer editing the frames and components that already exist. `get_app_state` lists them with ids;
  reuse them instead of creating near-duplicates.
- `get_style` loads visual style archetypes (fonts, colors, imagery) for a new direction. Use it
  when the user asks for a look rather than a specific pixel change.
- `browser` opens a real URL in the app's integrated browser and can reproduce the page, or one
  element of it, as editable canvas layers. `screenshot-to-canvas` places a screenshot instead.
- Prefer a few focused `execute` calls over one huge script; each call is a visible step the user
  can follow.

## Typical flows

- **New screen:** `get_app_state` → `read_skill {path:"execute.md"}` → `execute` to build the frame
  → `get_app_state` to confirm what landed.
- **Adjust existing work:** `get_app_state` to pick node ids → `execute` to change them →
  `get_app_state` to verify.
- **Clone a website:** `browser` with `load-page`, then `import-to-canvas` against a CSS selector,
  then review the imported frame.
- **Match a visual direction:** `get_style` → `execute` with the chosen typography and palette.

## When something is off

If the pen.dev tools are missing entirely, the desktop app is probably not installed or its MCP
server binary was not found; tell the user to check the `dsh-pen-dev` warning in the harness log.

If `execute` reports a canvas/IPC error, confirm `filePath` matches the active document from
`get_app_state` — a stale path from a previously closed document is the common cause.

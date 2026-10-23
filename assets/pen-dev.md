# pen.dev canvas work

pen.dev is a live infinite-canvas design editor. In this session its tools are exposed as
`mcp__pen__browser`, `mcp__pen__execute`, `mcp__pen__get_app_state`, `mcp__pen__get_style`,
and `mcp__pen__read_skill`. The user is watching the canvas, so treat every write as visible work.

## Before touching anything

1. Call `mcp__pen__read_skill`. It returns pen.dev's own authoritative documentation
   (`execute.md`, `pen-schema.md`, `scripts-and-shaders.md`, and named guides). Do not guess the
   `execute` API or the `.pen` schema when that call can tell you.
2. Call `mcp__pen__get_app_state`. It reports the active document, the current selection, the
   top-level frames, reusable components, and whether the integrated browser is open.

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
- Big documents can exceed the default 60 s tool timeout for `browser` and `execute`. Prefer a few
  focused calls over one huge script.

## Typical flows

- **New screen:** `get_app_state` → `read_skill` → `execute` to build the frame → `get_app_state`
  to confirm what landed.
- **Adjust existing work:** `get_app_state` to pick node ids → `execute` to change them →
  `get_app_state` to verify.
- **Clone a website:** `browser` with `load-page`, then `import-to-canvas` against a CSS selector,
  then review the imported frame.
- **Match a visual direction:** `get_style` → `execute` with the chosen typography and palette.

## When something is off

If the pen.dev tools are missing entirely, the desktop app is probably not installed or its MCP
server binary was not found; tell the user to check the `dsh-pen-dev` warning in the harness log.

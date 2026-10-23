# dsh-pen-dev

**Unofficial** [pen.dev](https://pen.dev) integration for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

It connects the pen.dev desktop app's MCP server to a DSH session, so the model can design on the
live pen.dev canvas, inspect frames and components, reproduce web pages as editable layers, and use
pen.dev's own style archetypes. It also adds a small `pen-dev` skill that teaches the canvas
workflow and points at pen.dev's authoritative `read_skill` documentation.

Not affiliated with or endorsed by pen.dev. `pen.dev` and its desktop app are their authors'
property; this package ships no pen.dev binaries — it locates the MCP server inside an installed app.

## What you get

| Tool | Use |
| --- | --- |
| `mcp__pen__get_app_state` | Active document, selection, top-level frames, components, browser state |
| `mcp__pen__read_skill` | pen.dev's own canvas API docs (`execute`, schema, guides) |
| `mcp__pen__execute` | Run canvas operations against the open `.pen` document |
| `mcp__pen__get_style` | Load visual style archetypes (fonts, colors, imagery) |
| `mcp__pen__browser` | Open a real site in the app's browser, reproduce it as editable layers |

Plus the bundled `pen-dev` skill.

## Requirements

- **DeepSeek Harness** with the `@deepseek-ai/dsh-mcp-client` plugin available. Developed and tested
  against DSH `0.2.1-rc.2`.
- **pen.dev desktop app** installed. Developed and tested with Pen 1.2.19 on macOS (arm64).
  The app ships its MCP server at
  `Pen.app/Contents/Resources/app.asar.unpacked/out/mcp-server-<platform>-<arch>`.

## Install

### From the DSH app (recommended)

Sidebar **Plugins → Add plugin → Install third-party plugin**, then enter the package name:

```
dsh-pen-dev
```

Accept a local path or Git URL there too.

### From the CLI

```bash
dsh plugin --profile <profile> add dsh-pen-dev
```

The bundle is enabled when it is installed. With HMR on, the tools appear without a restart;
otherwise restart the app.

### From a plugin market

If a market index lists this plugin, open **Plugins → Explore → Add index source**, paste the index
URL, then install from the results. [`market/index.json`](market/index.json) is a ready format-1
entry; [`PUBLISHING.md`](PUBLISHING.md) explains hosting one and why this DSH build has no official
submission channel yet.

### Manual equivalent

If you prefer the explicit YAML (for example while the package is not on npm yet, using a local
path), install the package into the profile and let its bundle patch apply. The two rows it adds
are:

```yaml
- insert:
    - id: pen-dev
      name: dsh-pen-dev
    - id: pen-dev-skill
      name: dsh-pen-dev/skill
```

**If you previously hand-wired pen.dev**, delete your manual `mcp-client` row first. Two
mcp-client instances cannot share one `serverName`; the second one fails with
`serverName "pen" is already in use`.

## How this relates to the official pen.dev MCP config

pen.dev documents the desktop integration as:

```json
{"name":"pencil","transport":"stdio","command":"…/mcp-server-<platform>-<arch>","args":["--app","desktop"],"env":{}}
```

This bundle mounts exactly that server: same binary, same `--app desktop`, same five tools
(`browser`, `execute`, `get_app_state`, `get_style`, `read_skill`). On top of the minimal config it:

- locates the binary by probing `/Applications`, `~/Applications`, `/opt`, and (on Windows)
  `%LOCALAPPDATA%\Programs`, so a non-standard install works without editing config files
- passes `--agent deepseekHarness` so the pen.dev app can tell this connection apart from Claude Code
  or Codex; override it with `PEN_MCP_AGENT`
- forwards `PEN_MCP_CONVERSATION_ID` as `--conversation_id`
- raises the per-call timeout to 120 s, because `execute` and `browser` can exceed the 60 s default

`--enable_spawn_agents` is off by default: it would let pen.dev start its own agents outside DeepSeek
Harness. Set `PEN_MCP_ENABLE_SPAWN_AGENTS=1` to enable it deliberately.

The `@pencil.dev/cli` npm package ships a *different* MCP server build — nine `filePath`-based tools
for its headless `.pen` editor. It is not a drop-in replacement for this integration: against the
desktop app that server's IPC methods are not implemented (`No handler found for method
'get-editor-state'`).

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `PEN_MCP_BIN` | — | Absolute path to the pen.dev MCP server binary. Use it for a non-standard install or another platform. |
| `PEN_APP_PATH` | auto-detected | Absolute path to the pen.dev app bundle, when detection misses it. |
| `PEN_MCP_AGENT` | `deepseekHarness` | `--agent` value the pen.dev app sees for this connection. |
| `PEN_MCP_CONVERSATION_ID` | — | Forwarded as `--conversation_id`. |
| `PEN_MCP_ENABLE_SPAWN_AGENTS` | off | `1` or `true` passes `--enable_spawn_agents` (adds a `spawn_agents` tool). |
| `PEN_MCP_SERVER_NAME` | `pen` | MCP namespace, i.e. the `mcp__<name>__*` prefix. |

The binary path is computed when the profile activates. The patch probes the usual install roots with
`node:fs`, so `PEN_APP_PATH` is only needed when the app lives somewhere unusual. If nothing is
found, mcp-client reports the spawn failure, adds no tools, and the rest of the harness keeps
working.

## Notes and caveats

- `.pen` files are encrypted. Only the MCP tools can read or write them — never open them with
  filesystem tools.
- The tools edit the document the user is looking at. Treat `execute` as a visible, destructive
  action.
- One editor per canvas at a time: if another agent (for example Claude Code) is also connected to
  Pen, avoid having both write simultaneously.
- `PEN_MCP_BIN` requires the enclosing app (or a launcher that sets the variable) to pass it
  through. On macOS, GUI apps do not inherit your shell environment; `PEN_APP_PATH` exists mainly
  for launchers that do.
- Windows/Linux: the path probe understands the usual Electron layouts, but only macOS is tested;
  `PEN_MCP_BIN` always wins when set.

## Uninstall

Remove the bundle from the profile (Plugins UI, or `dsh plugin --profile <profile> remove dsh-pen-dev`).
If you had a manual `mcp-pen` row before, restore it.

## License

MIT. Unofficial community package; see the disclaimer above.

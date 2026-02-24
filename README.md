# Kite Language

Language support for Kite configuration files (`.kite`) in VS Code and Cursor.

## Features

- **Syntax highlighting** — Grammar for `.kite` source files
- **Language Server (LSP)** — Diagnostics, hover, go-to-definition, and other features via the `kite-ls` server
- **Restart Language Server** — Command palette: **Kite: Restart Language Server** (useful after changing `kite.kite-ls.path` or rebuilding kite-ls)

## Requirements

- **kite-ls** — The Kite language server binary. The extension will:
  - Prefer the path set in **Kite: Kite LS Path** (`kite.kite-ls.path`)
  - Otherwise look for `bin/kite-ls` in the workspace or ancestor directories
  - Otherwise use `kite-ls` from your `PATH`

Build kite-ls from the Kite repo:

```bash
make build-kite-ls
```

The binary is produced at `bin/kite-ls`.

## Installation

### From VSIX (local)

1. Build the extension: `cd editor && npm install && npm run compile`
2. Package: `npx vsce package` (optional, produces `.vsix`)
3. Install the `.vsix` via **Extensions** → **...** → **Install from VSIX**, or run the extension from source (F5 in the kite workspace).

### From source (development)

1. Clone the kite repo and build kite-ls: `make build-kite-ls`
2. Open the repo in VS Code/Cursor
3. `cd editor && npm install && npm run compile`
4. Press **F5** to launch the Extension Development Host. Open a `.kite` file to use the extension.

## Configuration

| Setting             | Description                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `kite.kite-ls.path` | Path to the `kite-ls` language server binary. Leave empty to use workspace `bin/kite-ls` or `kite-ls` from PATH. |

## Commands

| Command                           | Description                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| **Kite: Restart Language Server** | Restarts the LSP server (e.g. after changing the kite-ls path or rebuilding). |

## License

MIT — see the LICENSE file in the extension root.

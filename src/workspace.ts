import * as fs from "fs"
import * as path from "path"
import { Uri, window, workspace } from "vscode"

/**
 * Returns the first workspace folder path, or the directory of the active document.
 */
export function getWorkspaceRoot(): string | undefined {
  const roots = workspace.workspaceFolders ?? []
  if (roots.length > 0) {
    return roots[0].uri.fsPath
  }
  const active = window.activeTextEditor?.document
  if (active?.uri.scheme === "file") {
    return path.dirname(active.uri.fsPath)
  }
  return undefined
}

/**
 * Finds a .kite file to operate on: active editor, project.kite, or first .kite in workspace.
 */
export function findKiteFile(): Uri | undefined {
  const active = window.activeTextEditor?.document
  if (active?.uri.scheme === "file" && active.uri.fsPath.endsWith(".kite")) {
    return active.uri
  }
  const roots = workspace.workspaceFolders ?? []
  for (const root of roots) {
    const projectKite = Uri.joinPath(root.uri, "project.kite")
    if (fs.existsSync(projectKite.fsPath)) {
      return projectKite
    }
  }
  for (const root of roots) {
    const found = findFirstKiteFile(root.uri.fsPath)
    if (found) return Uri.file(found)
  }
  return undefined
}

function findFirstKiteFile(dir: string, depth = 0): string | undefined {
  if (depth > 3) return undefined
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isFile() && e.name.endsWith(".kite")) {
        return full
      }
      if (e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules") {
        const found = findFirstKiteFile(full, depth + 1)
        if (found) return found
      }
    }
  } catch {
    // ignore
  }
  return undefined
}

/**
 * Walks up from startDir looking for bin/kite-ls, up to maxDepth levels.
 */
export function findKiteLsBinary(): string | undefined {
  const ext = process.platform === "win32" ? ".exe" : ""
  const binName = `kite-ls${ext}`

  const check = (dir: string): string | undefined => {
    const candidate = path.join(dir, "bin", binName)
    return fs.existsSync(candidate) ? candidate : undefined
  }

  const checkAncestors = (startDir: string, maxDepth = 8): string | undefined => {
    let dir = startDir
    for (let i = 0; i < maxDepth; i++) {
      const found = check(dir)
      if (found) return found
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
    return undefined
  }

  const roots = (workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath)
  for (const root of roots) {
    const found = check(root)
    if (found) return found
  }
  for (const root of roots) {
    const found = checkAncestors(root)
    if (found) return found
  }

  const active = window.activeTextEditor?.document
  if (active?.uri.scheme === "file") {
    return checkAncestors(path.dirname(active.uri.fsPath))
  }

  return undefined
}

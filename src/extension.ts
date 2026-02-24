import * as fs from "fs"
import * as path from "path"
import { ExtensionContext, TextDocument, commands, languages, window, workspace } from "vscode"
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient"

let client: LanguageClient | undefined

function findKiteLsBinary(): string | undefined {
  const ext = process.platform === "win32" ? ".exe" : ""
  const binName = `kite-ls${ext}`
  const check = (dir: string): string | undefined => {
    const candidate = path.join(dir, "bin", binName)
    return fs.existsSync(candidate) ? candidate : undefined
  }
  const checkAncestors = (startDir: string): string | undefined => {
    let dir = startDir
    // Walk up a few levels to support opening `examples/` as the workspace.
    for (let i = 0; i < 8; i++) {
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
    const found = checkAncestors(path.dirname(active.uri.fsPath))
    if (found) return found
  }

  return undefined
}

async function ensureKiteLanguageForDocument(doc: TextDocument): Promise<void> {
  if (doc.uri.scheme !== "file") return
  if (!doc.uri.fsPath.endsWith(".kite")) return
  if (doc.languageId === "kite") return
  try {
    // Force `.kite` files into kite language mode so the grammar + LSP activate even if another
    // extension/user association has claimed the file extension.
    await languages.setTextDocumentLanguage(doc, "kite")
  } catch {
    // Best-effort only.
  }
}

function getServerCommand(): string {
  const config = workspace.getConfiguration("kite")
  const kiteLsPath = config.get<string>("kite-ls.path") ?? ""
  if (kiteLsPath && kiteLsPath.trim() !== "") {
    return kiteLsPath.trim()
  }
  return findKiteLsBinary() ?? (process.platform === "win32" ? "kite-ls.exe" : "kite-ls")
}

function validateServerPath(serverCommand: string): boolean {
  const looksLikePath = serverCommand.includes(path.sep) || serverCommand.startsWith(".")
  if (looksLikePath && !fs.existsSync(serverCommand)) {
    void window.showErrorMessage(
      `Kite: kite-ls not found at "${serverCommand}". Run "make build-kite-ls" (workspace bin/kite-ls) or set kite.kite-ls.path.`
    )
    return false
  }
  return true
}

async function startLanguageServer(): Promise<boolean> {
  const serverCommand = getServerCommand()
  if (!validateServerPath(serverCommand)) return false

  const serverOptions: ServerOptions = {
    command: serverCommand,
    args: [],
    transport: TransportKind.stdio,
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: "kite" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.kite"),
    },
  }

  client = new LanguageClient(
    "kiteLanguageServer",
    "Kite Language Server",
    serverOptions,
    clientOptions
  )
  await client.start()
  return true
}

async function restartLanguageServer(): Promise<void> {
  if (client) {
    await client.stop()
    client = undefined
  }
  const started = await startLanguageServer()
  if (started) {
    void window.showInformationMessage("Kite: Language server restarted.")
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  for (const doc of workspace.textDocuments) {
    void ensureKiteLanguageForDocument(doc)
  }
  context.subscriptions.push(
    workspace.onDidOpenTextDocument((doc) => {
      void ensureKiteLanguageForDocument(doc)
    })
  )

  context.subscriptions.push(
    commands.registerCommand("kite.restartLanguageServer", restartLanguageServer)
  )

  await startLanguageServer()
}

export function deactivate(): Thenable<void> | undefined {
  if (client) {
    return client.stop()
  }
  return undefined
}

import * as fs from "fs"
import * as path from "path"
import { window, workspace } from "vscode"
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient"
import { findKiteLsBinary } from "./workspace"

let client: LanguageClient | undefined

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

export async function startLanguageServer(): Promise<boolean> {
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

export async function restartLanguageServer(): Promise<void> {
  if (client) {
    await client.stop()
    client = undefined
  }
  const started = await startLanguageServer()
  if (started) {
    void window.showInformationMessage("Kite: Language server restarted.")
  }
}

export function stopLanguageServer(): Thenable<void> | undefined {
  if (client) {
    return client.stop()
  }
  return undefined
}

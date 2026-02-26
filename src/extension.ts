import { ExtensionContext, TextDocument, commands, languages, workspace } from "vscode"
import { restartLanguageServer, startLanguageServer, stopLanguageServer } from "./server"

async function ensureKiteLanguageForDocument(doc: TextDocument): Promise<void> {
  if (doc.uri.scheme !== "file") return
  if (!doc.uri.fsPath.endsWith(".kite")) return
  if (doc.languageId === "kite") return
  try {
    await languages.setTextDocumentLanguage(doc, "kite")
  } catch {
    // Best-effort only.
  }
}

function registerLazyCommand(
  id: string,
  importFn: () => Promise<{ default: () => Promise<void> }>
) {
  return commands.registerCommand(id, async () => {
    const mod = await importFn()
    return mod.default()
  })
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

  // Lazy-load CLI module only when a command is invoked
  context.subscriptions.push(
    registerLazyCommand("kite.diff", () => import("./cli").then((m) => ({ default: m.runDiff }))),
    registerLazyCommand("kite.validate", () =>
      import("./cli").then((m) => ({ default: m.runValidate }))
    ),
    registerLazyCommand("kite.compile", () =>
      import("./cli").then((m) => ({ default: m.runCompile }))
    ),
    registerLazyCommand("kite.format", () =>
      import("./cli").then((m) => ({ default: m.runFormat }))
    ),
    registerLazyCommand("kite.installPlugins", () =>
      import("./cli").then((m) => ({ default: m.runInstallPlugins }))
    ),
    registerLazyCommand("kite.installModules", () =>
      import("./cli").then((m) => ({ default: m.runInstallModules }))
    ),
    registerLazyCommand("kite.installAll", () =>
      import("./cli").then((m) => ({ default: m.runInstallAll }))
    ),
    registerLazyCommand("kite.init", () => import("./cli").then((m) => ({ default: m.runInit })))
  )

  await startLanguageServer()
}

export function deactivate(): Thenable<void> | undefined {
  return stopLanguageServer()
}

import * as path from "path"
import { spawn } from "child_process"
import { OutputChannel, Range, TextEdit, WorkspaceEdit, window, workspace } from "vscode"
import { findKiteFile, getWorkspaceRoot } from "./workspace"

const OUTPUT_CHANNEL_NAME = "Kite"

let outputChannel: OutputChannel | undefined

function getOutputChannel(): OutputChannel {
  if (!outputChannel) {
    outputChannel = window.createOutputChannel(OUTPUT_CHANNEL_NAME)
  }
  return outputChannel
}

function getKiteCommand(): string {
  const config = workspace.getConfiguration("kite")
  const kitePath = config.get<string>("kite.path") ?? ""
  if (kitePath && kitePath.trim() !== "") {
    return kitePath.trim()
  }
  return process.platform === "win32" ? "kite.exe" : "kite"
}

export interface RunResult {
  exitCode: number
  stdout: string
  stderr: string
}

export function runKiteCommand(args: string[], cwd?: string): Promise<RunResult> {
  const cmd = getKiteCommand()
  const channel = getOutputChannel()
  channel.appendLine(`$ ${cmd} ${args.join(" ")}`)

  return new Promise((resolve) => {
    const workDir = cwd ?? getWorkspaceRoot() ?? process.cwd()
    const proc = spawn(cmd, args, {
      cwd: workDir,
      shell: process.platform === "win32",
    })

    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data: Buffer) => {
      const s = data.toString()
      stdout += s
      channel.append(s)
    })
    proc.stderr?.on("data", (data: Buffer) => {
      const s = data.toString()
      stderr += s
      channel.append(s)
    })

    proc.on("close", (code, signal) => {
      const exitCode = code ?? (signal ? 1 : 0)
      if (exitCode !== 0) {
        channel.appendLine(`[exit ${exitCode}]`)
      }
      resolve({ exitCode, stdout, stderr })
    })

    proc.on("error", (err) => {
      channel.appendLine(`Error: ${err.message}`)
      resolve({ exitCode: 1, stdout, stderr: err.message })
    })
  })
}

export async function runCompile(): Promise<void> {
  const file = findKiteFile()
  const args = ["compile", "--auto-approve", "--no-color"].concat(file ? [file.fsPath] : [])
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  const result = await runKiteCommand(args)
  if (result.exitCode === 0) {
    void window.showInformationMessage("Kite: Compile succeeded.")
  } else {
    void window.showErrorMessage("Kite: Compile failed. See Output for details.")
  }
}

export async function runValidate(): Promise<void> {
  const file = findKiteFile()
  const args = ["validate"].concat(file ? [file.fsPath] : [])
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  const result = await runKiteCommand(args)
  if (result.exitCode === 0) {
    void window.showInformationMessage("Kite: Validation passed.")
  } else {
    void window.showErrorMessage("Kite: Validation failed. See Output for details.")
  }
}

export async function runFormat(): Promise<void> {
  const file = findKiteFile()
  if (!file) {
    void window.showErrorMessage("Kite: No .kite file open. Open a file to format.")
    return
  }
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  const result = await runKiteCommand(["fmt", "-w"].concat(file ? [file.fsPath] : []))
  if (result.exitCode === 0) {
    const content = await workspace.fs.readFile(file)
    const formatted = Buffer.from(content).toString("utf-8")
    const doc = workspace.textDocuments.find((d) => d.uri.toString() === file.toString())
    if (doc) {
      const len = doc.getText().length
      const fullRange = new Range(doc.positionAt(0), doc.positionAt(len > 0 ? len : 0))
      const edit = new WorkspaceEdit()
      edit.set(file, [TextEdit.replace(fullRange, formatted)])
      await workspace.applyEdit(edit)
    }
    void window.showInformationMessage("Kite: Document formatted.")
  } else {
    void window.showErrorMessage("Kite: Format failed. See Output for details.")
  }
}

export async function runDiff(): Promise<void> {
  const file = findKiteFile()
  const args = ["diff", "--no-color"].concat(file ? [file.fsPath] : [])
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  await runKiteCommand(args)
}

export async function runInstallPlugins(): Promise<void> {
  const args = ["plugin", "install"]
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  await runKiteCommand(args)
}

export async function runInstallModules(): Promise<void> {
  const args = ["module", "install"]
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  await runKiteCommand(args)
}

export async function runInstallAll(): Promise<void> {
  await Promise.all([runInstallPlugins(), runInstallModules()])
}

export async function runInit(): Promise<void> {
  const root = getWorkspaceRoot()
  if (!root) {
    void window.showErrorMessage("Kite: No workspace folder open.")
    return
  }
  const projectName = path.basename(root)
  const channel = getOutputChannel()
  channel.clear()
  channel.show(true)
  const result = await runKiteCommand(["init", projectName], root)
  if (result.exitCode === 0) {
    void window.showInformationMessage("Kite: Project initialized.")
  } else {
    void window.showErrorMessage("Kite: Init failed. See Output for details.")
  }
}

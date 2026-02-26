import * as esbuild from "esbuild"

const production = process.env.NODE_ENV === "production"

/** @type {import('esbuild').BuildOptions} */
const base = {
  platform: "node",
  target: "node18",
  format: "cjs",
  bundle: true,
  minify: production,
  sourcemap: !production,
  external: ["vscode"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
  },
  logLevel: "info",
}

async function build() {
  await esbuild.build({
    ...base,
    entryPoints: ["src/extension.ts"],
    outfile: "out/extension.js",
  })
}

async function watch() {
  const ctx = await esbuild.context({
    ...base,
    entryPoints: ["src/extension.ts"],
    outfile: "out/extension.js",
  })
  await ctx.watch()
}

async function analyze() {
  const result = await esbuild.build({
    ...base,
    entryPoints: ["src/extension.ts"],
    outfile: "out/extension.js",
    metafile: true,
  })
  const text = await esbuild.analyzeMetafile(result.metafile, {
    verbose: true,
  })
  console.log(text)
}

const cmd = process.argv[2]
if (cmd === "watch") {
  watch()
} else if (cmd === "analyze") {
  analyze()
} else {
  build()
}

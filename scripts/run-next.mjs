import { resolve } from "node:path"
import { spawn } from "node:child_process"

const [mode = "dev", ...extraArgs] = process.argv.slice(2)

const distDir = mode === "dev" ? ".next" : ".next-build"
const nextBin = resolve("node_modules", "next", "dist", "bin", "next")

const child = spawn(process.execPath, [nextBin, mode, ...extraArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir
  }
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

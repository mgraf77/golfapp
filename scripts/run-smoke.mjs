// Bundles scripts/smoke.ts with esbuild and runs it under node.
import { build } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

for (const entry of ['smoke.ts', 'render-smoke.tsx']) {
  const out = entry.replace(/\.tsx?$/, '.mjs')
  await build({
    configFile: false,
    logLevel: 'error',
    esbuild: { jsx: 'automatic' },
    build: {
      ssr: resolve(root, 'scripts', entry),
      outDir: resolve(root, 'node_modules/.smoke'),
      emptyOutDir: false,
      rollupOptions: { output: { entryFileNames: out } },
    },
  })
  execFileSync(process.execPath, [resolve(root, 'node_modules/.smoke', out)], { stdio: 'inherit' })
}

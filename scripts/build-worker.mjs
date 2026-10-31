import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const serverDir = resolve(root, 'dist/server')
const clientServiceWorker = resolve(root, 'dist/client/sw.js')

await rm(serverDir, { recursive: true, force: true })
await mkdir(serverDir, { recursive: true })
await build({
  entryPoints: [resolve(root, 'worker/index.ts')],
  outfile: resolve(serverDir, 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  sourcemap: true,
})

// A unique service-worker body makes installed PWAs detect every deployment,
// even when the application shell logic itself did not change.
const serviceWorker = await readFile(clientServiceWorker, 'utf8')
await writeFile(clientServiceWorker, serviceWorker.replace('__BUILD_ID__', `${Date.now()}`))

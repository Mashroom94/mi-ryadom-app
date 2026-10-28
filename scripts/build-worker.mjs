import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const serverDir = resolve(root, 'dist/server')
const metadataDir = resolve(root, 'dist/.openai')
const clientServiceWorker = resolve(root, 'dist/client/sw.js')

await rm(serverDir, { recursive: true, force: true })
await mkdir(serverDir, { recursive: true })
await mkdir(metadataDir, { recursive: true })
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
await cp(resolve(root, '.openai/hosting.json'), resolve(metadataDir, 'hosting.json'))
await cp(resolve(root, 'drizzle'), resolve(metadataDir, 'drizzle'), { recursive: true, force: true })

// A unique service-worker body makes installed PWAs detect every deployment,
// even when the application shell logic itself did not change.
const serviceWorker = await readFile(clientServiceWorker, 'utf8')
await writeFile(clientServiceWorker, serviceWorker.replace('__BUILD_ID__', `${Date.now()}`))

const hosting = JSON.parse(await readFile(resolve(root, '.openai/hosting.json'), 'utf8'))
await writeFile(resolve(serverDir, 'wrangler.json'), JSON.stringify({
  main: 'index.js',
  compatibility_date: '2026-05-15',
  assets: { directory: '../client', binding: 'ASSETS', not_found_handling: 'single-page-application' },
  d1_databases: hosting.d1 ? [{ binding: hosting.d1, database_name: 'my-ryadom', database_id: '00000000-0000-4000-8000-000000000000' }] : [],
}, null, 2))

/** Build the optional P1 browser entry against DSH 0.1.5-rc.1 only. */
import { build } from 'esbuild'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginId = '@jimwoocory/dsh-us-vertical-drama-studio'

await build({
  entryPoints: [resolve(root, 'dsh-plugin/client.js')],
  outfile: resolve(root, 'dsh-plugin/client.bundle.cjs'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome120', 'safari17'],
  treeShaking: true,
  minifySyntax: true,
  external: [
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-client-ui-slots',
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
  ],
  banner: {
    js: `window.__ModuleLoader__.load({id:${JSON.stringify(pluginId)},factory:(require)=>{var module={exports:{}};var exports=module.exports;`,
  },
  footer: { js: ';return module.exports;}});' },
})

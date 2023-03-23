import { join } from 'path'
import fs from 'fs'
import { createUnplugin } from 'unplugin'
import MagicString from 'magic-string'
import type { MetaCheckerOptions } from 'vue-component-meta'
import { createComponentMetaChecker } from 'vue-component-meta'
import { compile } from './compiler'
import { addonCss, defaultExtensions } from './extensions'
import type { Extension } from './type'
import { addonPostFix, assetFileNames, chunkFileNames, manualChunks } from './utils'

const codeMap: Map<string, string> = new Map()

export function addAddon(id: string, addon: string, mode: string) {
  id = id + addonPostFix
  const origin = codeMap.get(id) || `export const unplugin_vue_sfcmore="${mode}"\n`
  codeMap.set(id, origin + addon)
}

export const sfcmore = createUnplugin((options: { meta?: boolean; version?: string; extensions?: Extension[]; copysource?: boolean; checkerOptions?: MetaCheckerOptions } = {}) => {
  let isLib = false

  let mode: string

  const { checkerOptions = {}, meta = true, version, copysource, extensions } = options
  const tsconfigChecker = createComponentMetaChecker(
    // Write your tsconfig path
    join(process.cwd(), 'tsconfig.json'),
    checkerOptions,
  )

  function clearCache() {
    codeMap.clear()
    tsconfigChecker.clearCache()
  }
  return [
    {
      name: 'sfcmore:pre',
      enforce: 'pre',
      transform(source: string, id: string) {
        if (isSfc(id) && !codeMap.has(`${id}${addonPostFix}`)) {
          const { ms, addon } = compile(
            source,
            (extensions || defaultExtensions),
          )
          const code = ms.toString()
          if (code !== source) {
            addAddon(
              id,
              `${addon}\n${copysource ? `export const code=${JSON.stringify(code)}` : ''}`,
              mode,
            )
            return {
              code,
              map: ms.generateMap({ source: id, includeContent: true }),
            }
          }
        }
      },
      vite: {
        config(conf: any, { command }: any) {
          mode = command
          if (conf.build.lib && command === 'build') {
            isLib = true
            if (!conf.build)
              conf.build = {}

            if (!conf.build.rollupOptions)
              conf.build.rollupOptions = {}

            if (!conf.build.rollupOptions.output)
              conf.build.rollupOptions.output = {}

            const { output } = conf.build.rollupOptions
            output.chunkFileNames = output.chunkFileNames ?? chunkFileNames(version)
            output.assetFileNames = output.assetFileNames ?? assetFileNames(version)
            output.manualChunks = output.manualChunks || manualChunks
          }
        },
      },
    },
    {
      name: 'sfcmore:post',
      enforce: 'post',

      load(id: string) {
        if (id.endsWith(addonPostFix) && isLib)
          return codeMap.get(id)
      },
      transform(code: string, id: string) {
        if (isSfc(id) && codeMap.has(`${id}?vue&addon`)) {
          const ms = new MagicString(code)

          if (mode === 'serve') {
            ms.appendRight(code.length, codeMap.get(`${id}${addonPostFix}`) as string)
            return {
              code: ms.toString(), map: ms.generateMap({ source: id, includeContent: true }),

            }
          }

          if (isLib) {
            const addonCode
              = `export async function addon() {
                   return await import("${id}?vue&addon");
                 }`

            ms.appendRight(code.length, `${addonCode}\n${addonCss('import.meta.url.replace(/\\.js(.*)/,\'.css\')')}`)

            return {
              code: ms.toString(), map: ms.generateMap({ source: id, includeContent: true }),

            }
          }
        }
      },
    },
    {
      enforce: 'pre',
      name: 'vue-meta',
      transform(code: string, id: string) {
        if (meta && id.endsWith('.vue') && fs.existsSync(id) && codeMap.has(`${id}${addonPostFix}`)) {
          const meta = tsconfigChecker.getComponentMeta(id)
          addAddon(id, `\nexport const metadata=${JSON.stringify(meta)}`, mode)
        }
      },
      vite: {
        handleHotUpdate: clearCache,
        watchChange: clearCache,
      },
      rollup: {
        watchChange: clearCache,
      },
    },
  ] as any
})

function isSfc(id: string) {
  return id.endsWith('.vue')
}

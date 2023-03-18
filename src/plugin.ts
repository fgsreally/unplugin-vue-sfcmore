import { basename } from 'path'
import { createUnplugin } from 'unplugin'
import MagicString from 'magic-string'
import { compile } from './compiler'
import { addonCss, defaultExtensions } from './extensions'
import type { Extension } from './type'
export const codeMap: Map<string, string> = new Map()

export function addAddon(id: string, addon: string, mode: string) {
  const origin = codeMap.get(id) || `export const unplugin_vue_sfcmore="${mode}"\n`
  codeMap.set(id, origin + addon)
}

export const sfcmore = createUnplugin((options: { version?: string; extensions?: Extension[]; copysource?: boolean } = {}) => {
  let isLib = false
  let mode: string

  return [
    {
      name: 'sfcmore:pre',
      enforce: 'pre',
      transform(source: string, id: string) {
        if (isSfc(id) && !codeMap.has(`${id}?vue&addon`)) {
          const { ms, addon } = compile(
            source,
            (options.extensions || defaultExtensions),
          )
          const code = ms.toString()
          if (code !== source) {
            addAddon(
              `${id}?vue&addon`,
              `${addon}\n${options.copysource ? `export let code=${JSON.stringify(code)}` : ''}`,
              mode,
            )
          }
          return {
            code,
            map: ms.generateMap(),
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

            conf.build.rollupOptions.output.chunkFileNames = `[name]${
                options.version ? `@${options.version}` : ''
                    }.js`
            conf.build.rollupOptions.output.assetFileNames = `[name]${
                options.version ? `@${options.version}` : ''
                    }[extname]`
            conf.build.rollupOptions.output.manualChunks = (id: string) => {
              if (id.endsWith('.vue?vue&addon'))
                return `${basename(id, '.vue?vue&addon')}.addon`
            }
          }
        },
      },
    },
    {
      name: 'sfcmore:post',
      enforce: 'post',

      load(id: string) {
        if (id.endsWith('?vue&addon') && isLib)
          return codeMap.get(id)
      },
      transform(code: string, id: string) {
        if (isSfc(id) && codeMap.has(`${id}?vue&addon`)) {
          const ms = new MagicString(code)

          if (mode === 'serve') {
            ms.appendRight(code.length, codeMap.get(`${id}?vue&addon`) as string)
            return {
              code: ms.toString(), map: ms.generateMap(),

            }
          }

          if (isLib) {
            const addonCode
            = `export async function addon() {
                   return await import("${id}?vue&addon");
                 }`

            ms.appendRight(code.length, `${addonCode}\n${addonCss('import.meta.url.replace(/\\.js(.*)/,\'.css\')')}`)

            return {
              code: ms.toString(), map: ms.generateMap(),

            }
          }
        }
      },
    },
  ] as any
})

function isSfc(id: string) {
  return id.endsWith('.vue')
}

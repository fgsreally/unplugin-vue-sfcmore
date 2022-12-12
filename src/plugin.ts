import { basename } from 'path'
import { createUnplugin } from 'unplugin'
import { compile } from './compiler'
import { addonCss, defaultExtensions } from './extensions'
import type { Extension } from './type'

export const sfcmore = createUnplugin((options: { version?: string; extensions?: Extension[] } = {}) => {
  let isLib = false
  let mode: string
  const codeMap: Map<string, string> = new Map()

  return [
    {
      name: 'sfcmore:pre',
      enforce: 'pre',
      transform(source: string, id: string) {
        if (isSfc(id)) {
          const { code, addon } = compile(
            source,
            (options.extensions || defaultExtensions),
          )
          if (code !== source) {
            codeMap.set(
              `${id}?vue&addon`,
              `${addon}\nexport let code=${JSON.stringify(code)}`,
            )
          }
          return code
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
          if (mode === 'serve')
            return `${code}\n${codeMap.get(`${id}?vue&addon`)}`

          if (isLib) {
            const addonCode
            = `export async function addon() {
                   return await import("${id}?vue&addon");
                 }`

            return (
             `${code
                 }\n${
                 addonCode
                 }${addonCss('import.meta.url.replace(/\\.js(.*)/,\'.css\')')}`

            )
          }
        }
      },
    },
  ] as any
})

function isSfc(id: string) {
  return id.endsWith('.vue')
}

import { join } from 'path'
import fs from 'fs'
import { createUnplugin } from 'unplugin'
import MagicString from 'magic-string'
import type { MetaCheckerOptions } from 'vue-component-meta'
import { createComponentMetaChecker } from 'vue-component-meta'
import { compile } from './compiler'
import { defaultExtensions } from './extensions'
import type { Extension } from './type'
import { assetFileNames, chunkFileNames } from './utils'

const codeMap: Map<string, Record<string, string>> = new Map()
export function setAddon(fileId: string, tag: string, content: string) {
  fileId = getAddonId(fileId)
  if (!codeMap.has(fileId)) {
    console.warn('addon is not initialized yet')
  }
  else {
    const addonMap = codeMap.get(fileId)!
    addonMap[tag] = content
  }
}

function isInitlize(fileId: string) {
  fileId = getAddonId(fileId)

  return codeMap.has(fileId)
}

function initAddon(fileId: string, addonMap: Record<string, string>) {
  fileId = getAddonId(fileId)
  codeMap.set(fileId, addonMap)
}

function createCode(fileId: string) {
  if (isInitlize(fileId)) {
    fileId = getAddonId(fileId)

    const addonMap = codeMap.get(fileId)!
    return Object.entries(addonMap).map(([tag, content]) => `ret.${tag}=${content}`).join('\n')
  }
  return ''
}
export const sfcmore = createUnplugin((options: {
  /** 产物是否异步 */
  async?: boolean
  /** 是否生成vue的meta */
  meta?: boolean
  version?: string
  extensions?: Extension[]
  /** 是否加入源码 */
  copysource?: boolean
  checkerOptions?: MetaCheckerOptions
  /** 是否输出产物 */
  filter?: (fileId: string) => boolean
  write?: boolean
} = {}) => {
  let isLib = false

  let mode: string

  const { checkerOptions = {}, meta = true, version, copysource, extensions, write = true, filter = () => true, async = true } = options
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
        if (isSfc(id) && filter(id) && !isInitlize(id)) {
          const { ms, addonMap } = compile(
            source,
            (extensions || defaultExtensions),
          )
          initAddon(id, addonMap)
          const code = ms.toString()
          if (copysource)
            setAddon(id, 'source', JSON.stringify(code))

          return {
            code,
            map: ms.generateMap({ source: id, includeContent: true }),
          }
          // if (code !== source) {
          //   fileSet.add(id)
          //   addAddon(
          //     id,
          //     `${addon}\n${copysource ? `export const code=${JSON.stringify(code)}` : ''}`,
          //     mode,
          //   )

          // }
        }
      },
      vite: {
        config(conf: any, { command }: any) {
          mode = command
          if (conf.build?.lib && command === 'build') {
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
          }
        },
      },
    },
    {
      name: 'sfcmore:post',
      enforce: 'post',
      resolveId(id: string) {
        if (id.endsWith('.addon.js'))
          return id
      },
      load(id: string) {
        if (id.endsWith('.addon.js') && isLib)
          return `export default function(){const ret={}\n${createCode(id)}\nreturn ret} `
        // return codeMap.get(id)
      },
      transform(code: string, id: string) {
        if (write && isSfc(id) && isInitlize(id)) {
          const ms = new MagicString(code)

          if (mode === 'serve') {
            ms.appendRight(code.length, `\nexport function addon(){const ret={}\n${createCode(id)}\nreturn ret} `)
            return {
              code: ms.toString(), map: ms.generateMap({ source: id, includeContent: true }),

            }
          }

          if (isLib) {
            const addonCode
              = async
                ? `\nexport async function addon() {
                   return (await import("${getAddonId(id)}")).default();
                 }`
                : `\nexport function addon(){const ret={}\n${createCode(id)}\nreturn ret} `

            setAddon(id, 'css', 'import.meta.url.replace(/\\.addon\\.js(.*)/,\'.css\')')

            ms.appendRight(code.length, addonCode)

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
      transform(_: string, id: string) {
        if (meta && id.endsWith('.vue') && fs.existsSync(id) && isInitlize(id)) {
          const meta = tsconfigChecker.getComponentMeta(id)
          setAddon(id, 'metadata', JSON.stringify(meta))
        }
      },
      vite: {
        handleHotUpdate: clearCache,
        watchChange: clearCache,
        buildEnd: clearCache,
      },
      rollup: {
        watchChange: clearCache,
        buildEnd: clearCache,

      },
    },
  ] as any
})

function isSfc(id: string) {
  return id.endsWith('.vue')
}

function getAddonId(id: string) {
  return id.replace(/\.vue/, '.addon.js')
}

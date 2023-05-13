import type { VitePlugin } from 'unplugin'
import type { MetaCheckerOptions } from 'vue-component-meta'
import { sfcmore } from './plugin'
import type { Extension } from './type'

export const sfc = sfcmore.vite as (options?: {
  /** 是否生成vue的meta */
  meta?: boolean

  version?: string
  /** 插件 */

  extensions?: Extension[]
  /** 是否加入源码 */
  copysource?: boolean
  /** vue meta data 的配置 */

  checkerOptions?: MetaCheckerOptions
  /** 哪些vue文件需要被处理，默认处理全部 */
  filter?: (fileId: string) => boolean
  /** 是否输出产物 */
  write?: boolean
}) => VitePlugin

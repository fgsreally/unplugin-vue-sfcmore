import type { VitePlugin } from 'unplugin'
import type { MetaCheckerOptions } from 'vue-component-meta'
import { sfcmore } from './plugin'
import type { Extension } from './type'

export const sfc = sfcmore.vite as (options?: {
  /** 是否生成vue的meta */
  meta?: boolean
  version?: string
  extensions?: Extension[]
  /** 是否加入源码 */
  copysource?: boolean
  checkerOptions?: MetaCheckerOptions
  /** 是否输出产物 */

  write?: boolean
}) => VitePlugin

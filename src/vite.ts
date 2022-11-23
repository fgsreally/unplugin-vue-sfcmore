import type { VitePlugin } from 'unplugin'
import { sfcmore } from './plugin'
import type { Extension } from './type'
export const sfc = sfcmore.vite as (options?: { version?: string; extensions?: Extension[] }) => VitePlugin

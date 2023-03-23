import { basename } from 'path'

export const chunkFileNames = (version?: string) => `[name]${version ? `@${version}` : ''}.js`
export const assetFileNames = (version?: string) => `[name]${version ? `@${version}` : ''}[extname]`


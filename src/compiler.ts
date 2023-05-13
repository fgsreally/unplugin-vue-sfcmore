import MagicString from 'magic-string'
import { parse } from '@vue/compiler-dom'
import type { Extension } from './type'
export function compile(code: string, extensions: Extension[]) {
  const ms = new MagicString(code)
  // let addon = ''
  const ast = parse(code)
  const addonMap = {} as Record<string, string>
  ast.children.forEach((i: any) => {
    if (extensions.some(ext => i.tag === ext.tag && (!ext.key || i.props.some((item: any) => item.name === ext.key)))) {
      if (i.tag in addonMap)
        return
      const start = i.loc.start.offset
      const end = i.loc.end.offset
      const injectContent = extensions.find(ext => i.tag === ext.tag && (!ext.key || i.props.some((item: any) => item.name === ext.key)))?.transformer?.(code.slice(i.children[0].loc.start.offset, i.children[0].loc.end.offset))
      if (injectContent) {
        // addon += `const ${i.tag}=${injectContent}\n`
        addonMap[i.tag] = injectContent
      }

      ms.remove(start, end)
    }
  })
  // addon += `return ${[...addonSet].join(',')}`
  return {
    ms,
    // addon,
    addonMap,
  }
}

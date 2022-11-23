import MagicString from 'magic-string'
import type { ElementNode } from '@vue/compiler-dom'
import { parse } from '@vue/compiler-dom'
import type { Extension } from './type'
export function compile(code: string, extensions: Extension[]) {
  const ms = new MagicString(code)
  let addon = ''
  const ast = parse(code)
  for (const i of ast.children as ElementNode[]) {
    if (extensions.some(ext => i.tag === ext.tag && i.props.some(item => item.name === ext.key))) {
      const start = i.loc.start.offset
      const end = i.loc.end.offset
      addon += extensions.find(ext => i.props.some(item => item.name === ext.key))?.transformer?.(code.slice(i.children[0].loc.start.offset, i.children[0].loc.end.offset)) || ''
      ms.remove(start, end)
      break
    }
  }

  return {
    code: ms.toString(),
    addon,
  }
}

import MagicString from 'magic-string'
import { parse } from '@vue/compiler-dom'
import type { Extension } from './type'
export function compile(code: string, extensions: Extension[]) {
  const ms = new MagicString(code)
  let addon = ''
  const ast = parse(code)
  ast.children.forEach((i: any) => {
    if (extensions.some(ext => i.tag === ext.tag && (!ext.key || i.props.some((item: any) => item.name === ext.key)))) {
      const start = i.loc.start.offset
      const end = i.loc.end.offset
      addon += extensions.find(ext => i.tag === ext.tag && (!ext.key || i.props.some((item: any) => item.name === ext.key)))?.transformer?.(code.slice(i.children[0].loc.start.offset, i.children[0].loc.end.offset)) || ''
      addon += '\n'
      ms.remove(start, end)
    }
  })

  return {
    code: ms.toString(),
    addon,
  }
}

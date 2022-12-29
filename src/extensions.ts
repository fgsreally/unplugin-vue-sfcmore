export const Test = {
  tag: 'script',
  key: 'test',
  transformer: (code: string) => {
    return `export let test=(()=>{${code}})()`
  },
}

export const Server = {
  key: 'server', tag: 'script',
}

export const Docs = {
  tag: 'docs',
  transformer: (code: string) => {
    return `export let docs=${JSON.stringify(code)}`
  },
}

export const Meta = {
  tag: 'm',
  transformer: (code: string) => {
    return `export let meta=${code}`
  },
}

export const Type = {
  tag: 'script',
  key: 'type',
  transformer: (code: string) => {
    return `export let type=${JSON.stringify(code)}`
  },
}

export const addonCss = (url: string) => `
  export let css= ${url}
  `

export const defaultExtensions = [Type, Docs, Server, Test, Meta]

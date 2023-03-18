export const Props = {
  tag: 'props',
  transformer: (code: string) => {
    return `export const props=(()=>{${code}})()`
  },
}

export const Server = {
  tag: 'server',

}

export const Docs = {
  tag: 'docs',
  transformer: (code: string) => {
    return `export const docs=${JSON.stringify(code)}`
  },
}

export const Info = {
  tag: 'info',
  transformer: (code: string) => {
    return `export const info=${code}`
  },
}

// export const Type = {
//   tag: 'script',
//   key: 'type',
//   transformer: (code: string) => {
//     return `export const type=${JSON.stringify(code)}`
//   },
// }

export const addonCss = (url: string) => `
  export const css= ${url}
  `

export const defaultExtensions = [Docs, Server, Props, Info]

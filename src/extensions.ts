export const Props = {
  tag: 'props',
  transformer: (code: string) => {
    return `(()=>{${code}})()`
  }, // export const props=
}

export const Server = {
  tag: 'server',

}

export const Docs = {
  tag: 'docs',
  transformer: (code: string) => {
    return `${JSON.stringify(code)}`
  }, // export const docs=
}

export const Info = {
  tag: 'info',
  transformer: (code: string) => {
    return `${code}`
  }, // export const info=
}

export const defaultExtensions = [Docs, Server, Props, Info]

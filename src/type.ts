export interface Extension {
  key?: string
  tag: string
  transformer?: (code: string) => string
}

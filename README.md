# unplugin-vue-sfcmore
create meta in .vue and output to bundle

> now only tested in vite 

## quick-start
```ts
import { sfc } from 'unplugin-vue-sfcmore/vite'
export default {
  plugins: [sfc()]// work both in dev and prod
}
```
create `App.vue` and add custom tag
```vue
<template>
  ...
</template>

<docs lang="md">
  ## info
</docs>

```

### in dev mode:
```ts
// ...
export const docs = '## info'
```

### in prod mode

```ts
// in App.js
// ...
export function addon() {
  return await import('./App.addon.js')
}
// in App.addon.js
export const docs = '## info'

```

## extension
you can create rule for custom tag
> default extensions includes `docs`, `server`, `props`, `info`
```ts
// docs extension
export const Docs = {
  tag: 'docs',
  transformer: (code: string) => {
    return `export const docs=${JSON.stringify(code)}`
  },
}
```
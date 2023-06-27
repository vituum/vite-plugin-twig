<a href="https://npmjs.com/package/@vituum/vite-plugin-twig"><img src="https://img.shields.io/npm/v/@vituum/vite-plugin-twig.svg" alt="npm package"></a>
<a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/@vituum/vite-plugin-twig.svg" alt="node compatility"></a>

# ⚡️🌱 ViteTwig

```js
import twig from '@vituum/vite-plugin-twig'

export default {
    plugins: [
        twig()
    ],
    build: {
        rollupOptions: {
            input: ['index.twig.html']
        }
    }
}
```

* Read the [docs](https://vituum.dev/plugins/twig.html) to learn more about the plugin options.
* Use with [Vituum](https://vituum.dev) to get multi-page support.

## Basic usage

```html
<!-- index.twig with index.twig.json -->
{{ title }}
```
or
```html
<!-- index.json -->
{
  "template": "path/to/template.twig",
  "title": "Hello world"
}
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)
- [Vite](https://vitejs.dev/)

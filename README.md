<a href="https://npmjs.com/package/@vituum/vite-plugin-twig"><img src="https://img.shields.io/npm/v/@vituum/vite-plugin-twig.svg" alt="npm package"></a>
<a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/@vituum/vite-plugin-twig.svg" alt="node compatility"></a>

# ⚡️🌿 ViteTwig

```js
export default {
  plugins: [
    twig({
      filters: {},
      functions: {},
      extensions: [],
      namespaces: {}, 
      data: '*.json',
      globals: {
          template: 'path/to/template.twig'
      },
      filetypes: {
          html: /.(json.html|twig.json.html|twig.html)$/,
          json: /.(json.twig.html)$/
      }
    })
  ]
}
```

```html
<!-- index.html -->
<script type="application/json" data-format="twig">
  {
    "template": "path/to/template.twig",
    "title": "Hello world"
  }
</script>
```
or
```html
<!-- index.twig.html -->
{{ title }}
```
or
```html
<!-- index.json.html or index.twig.json.html  -->
{
  "template": "path/to/template.twig",
  "title": "Hello world"
}
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)

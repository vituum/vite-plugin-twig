interface TwigOptions {
    compileOptions?: Object
    renderOptions?: Object
}

export interface PluginUserConfig {
    reload?: boolean | Function
    root?: string
    filters?: Object
    functions?: Object
    extensions?: ((twig) => void)[],
    namespaces?: Object,
    globals?: Object
    data?: string | string[]
    formats?: string[]
    ignoredPaths?: string[]
    options?: TwigOptions
}

export default function plugin(options?: PluginUserConfig) : import('vite').Plugin[]

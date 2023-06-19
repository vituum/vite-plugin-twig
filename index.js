import { relative } from 'path'
import fs from 'fs'
import lodash from 'lodash'
import Twig from 'twig'
import { getPackageInfo, merge, pluginBundle, pluginError, pluginReload, processData } from 'vituum/utils/common.js'
import { renameBuildEnd, renameBuildStart } from 'vituum/utils/build.js'

const { name } = getPackageInfo(import.meta.url)

/**
 * @type {import('@vituum/vite-plugin-twig/types').PluginUserConfig}
 */
const defaultOptions = {
    reload: true,
    root: null,
    filters: {},
    functions: {},
    extensions: [],
    namespaces: {},
    globals: {
        format: 'twig'
    },
    data: ['src/data/**/*.json'],
    formats: ['twig', 'json.twig', 'json'],
    twig: {
        compileOptions: {},
        renderOptions: {}
    }
}

const renderTemplate = async ({ filename, server, root }, content, options) => {
    const initialFilename = filename.replace('.html', '')
    const output = {}
    const context = options.data
        ? processData({
            paths: options.data,
            root
        }, options.globals)
        : options.globals

    if (initialFilename.endsWith('.json')) {
        lodash.merge(context, JSON.parse(fs.readFileSync(server ? initialFilename : filename).toString()))

        if (!options.formats.includes(context.format)) {
            return new Promise((resolve) => {
                output.content = content
                resolve(output)
            })
        }

        content = '{% include template %}'

        if (typeof context.template === 'undefined') {
            const error = `${name}: template must be defined for file ${initialFilename}`

            return new Promise((resolve) => {
                output.error = error
                resolve(output)
            })
        }

        context.template = relative(options.root, context.template)
    } else if (fs.existsSync(filename + '.json')) {
        lodash.merge(context, JSON.parse(fs.readFileSync(`${initialFilename}.json`).toString()))
    }

    Twig.cache(false)

    if (!Array.isArray(options.extensions)) {
        throw new TypeError('\'extensions\' needs to be an array of functions!')
    } else {
        options.extensions.forEach(name => {
            // noinspection JSCheckFunctionSignatures
            Twig.extend(name)
        })
    }

    Object.keys(options.functions).forEach(name => {
        if (typeof options.functions[name] !== 'function') {
            throw new TypeError(`${name} needs to be a function!`)
        }

        Twig.extendFunction(name, options.functions[name])
    })

    Object.keys(options.filters).forEach(name => {
        if (typeof options.filters[name] !== 'function') {
            throw new TypeError(`${name} needs to be a function!`)
        }

        Twig.extendFilter(name, options.filters[name])
    })

    return new Promise((resolve) => {
        const onError = (error) => {
            output.error = error
            resolve(output)
        }

        const onSuccess = (content) => {
            output.content = content
            resolve(output)
        }

        Twig.twig(Object.assign({
            allowAsync: true,
            data: content,
            path: options.root + '/',
            namespaces: options.namespaces,
            rethrow: true
        }, options.twig.compileOptions)).renderAsync(context, options.twig.renderOptions).catch(onError).then(onSuccess)
    })
}

/**
 * @param {import('@vituum/vite-plugin-twig/types').PluginUserConfig} options
 * @returns [import('vite').Plugin]
 */
const plugin = (options = {}) => {
    let resolvedConfig
    let userEnv

    options = merge(defaultOptions, options)

    return [{
        name,
        config (userConfig, env) {
            userEnv = env
        },
        configResolved (config) {
            resolvedConfig = config

            if (!options.root) {
                options.root = config.root
            }
        },
        buildStart: async () => {
            if (userEnv.command !== 'build') {
                return
            }

            await renameBuildStart(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        buildEnd: async () => {
            if (userEnv.command !== 'build') {
                return
            }

            await renameBuildEnd(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        transformIndexHtml: {
            order: 'pre',
            async transform (content, { filename, server }) {
                if (!options.formats.find(format => filename.replace('.html', '').endsWith(format))) {
                    return content
                }

                const render = await renderTemplate({ filename, server, root: resolvedConfig.root }, content, options)
                const renderError = pluginError(render.error, server, name)

                if (renderError && server) {
                    return
                } else if (renderError) {
                    return renderError
                }

                return render.content
            }
        },
        handleHotUpdate: ({ file, server }) => pluginReload({ file, server }, options)
    }, pluginBundle(options.formats)]
}

export default plugin

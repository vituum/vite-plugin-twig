import { relative, resolve } from 'node:path'
import fs from 'node:fs'
import lodash from 'lodash'
import Twig from 'twig'
import {
    getPackageInfo,
    merge,
    pluginBundle,
    pluginMiddleware,
    pluginReload, pluginTransform,
    processData
} from 'vituum/utils/common.js'
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
    ignoredPaths: [],
    options: {
        compileOptions: {},
        renderOptions: {}
    }
}

const renderTemplate = async ({ filename, server, resolvedConfig }, content, options) => {
    const initialFilename = filename.replace('.html', '')
    const output = {}
    const context = options.data
        ? processData({
            paths: options.data,
            root: resolvedConfig.root
        }, options.globals)
        : options.globals

    if (initialFilename.endsWith('.json')) {
        lodash.merge(context, JSON.parse(content))

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

        context.template = relative(resolvedConfig.root, context.template).startsWith(relative(resolvedConfig.root, options.root)) ? resolve(resolvedConfig.root, context.template) : resolve(options.root, context.template)
        context.template = relative(options.root, context.template)
    } else if (fs.existsSync(initialFilename + '.json')) {
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
        }, options.options.compileOptions)).renderAsync(context, options.options.renderOptions).catch(onError).then(onSuccess)
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
            if (userEnv.command !== 'build' || !resolvedConfig.build.rollupOptions.input) {
                return
            }

            await renameBuildStart(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        buildEnd: async () => {
            if (userEnv.command !== 'build' || !resolvedConfig.build.rollupOptions.input) {
                return
            }

            await renameBuildEnd(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        transformIndexHtml: {
            order: 'pre',
            async handler (content, { path, filename, server }) {
                return pluginTransform(content, { path, filename, server }, { name, options, resolvedConfig, renderTemplate })
            }
        },
        handleHotUpdate: ({ file, server }) => pluginReload({ file, server }, options)
    }, pluginBundle(options.formats), pluginMiddleware(name, options.formats)]
}

export default plugin

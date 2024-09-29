const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');
const HTMLTagsPlugin = require('html-webpack-tags-plugin');
const autoLoaderPath = require.resolve('../scenes/doc/loaders/auto-loader');
const entryLoaderPath = require.resolve('../scenes/doc/loaders/entry-loader');
const yamlDocLoaderPath = require.resolve('../webpack/loaders/yaml-doc-loader');
const MiniCSSExtractPlugin = require('@kubevue/mini-css-extract-plugin');
const chainCSSOneOfs = require('../webpack/chainCSSOneOfs');
const kubevue = require('kubevue-api');

// markdown-it
const iterator = require('markdown-it-for-inline');
const uslug = require('uslug');
const uslugify = (s) => uslug(s);

function chainMarkdown(config, rule) {
    return rule.use('cache-loader')
        .loader('cache-loader')
        .options(config.module.rule('vue').use('cache-loader').get('options'))
        .end()
        .use('vue-loader')
        .loader('vue-loader')
        .options(config.module.rule('vue').use('vue-loader').get('options'))
        .end()
        .use('@kubevue/md-vue-loader')
        .loader('@kubevue/md-vue-loader')
        .options({
            wrapper: 'u-article',
            plugins: [
                require('markdown-it-ins'),
                require('markdown-it-mark'),
                require('markdown-it-abbr'),
                require('markdown-it-deflist'),
                [require('markdown-it-anchor'), {
                    slugify: uslugify,
                    permalink: true,
                    permalinkClass: 'heading-anchor',
                    permalinkSymbol: '#',
                }],
                // require('markdown-it-container'),
                [iterator, 'link_converter', 'link_open', (tokens, idx) => {
                    tokens[idx].tag = 'u-link';
                    const aIndex = tokens[idx].attrIndex('href');
                    if (aIndex >= 0) {
                        const attr = tokens[idx].attrs[aIndex];
                        if (attr[1].startsWith('#')) {
                            tokens[idx].attrPush([':to', `{ hash: '${attr[1]}' }`]);
                            tokens[idx].attrs.splice(aIndex, 1);
                        }
                    }
                }],
                [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
            ],
            showCodeLineCount: 5,
            codeProcess(live, code, content, lang, modifier) {
                const relativePath = path.relative(process.cwd(), this.loader.resourcePath).replace(/\\/g, '/').replace(/^(\.\.\/)+/, '');

                if (live) {
                    const lineCount = content.split('\n').length;
                    return `<u-code-example
:show-code="${lineCount <= this.options.showCodeLineCount}"
:show-detail="${lang === 'vue'}"
file-path="${relativePath}">
<div${modifier ? ' style="' + modifier + '"' : ''}>${live}</div>
<div slot="code">${code}</div>
</u-code-example>\n\n`;
                } else
                    return code;
            },
        })
        .end();
}

module.exports = function chainDoc(api, vueConfig, kubevueConfig) {
    vueConfig.publicPath = kubevueConfig.docs && kubevueConfig.docs.base ? kubevueConfig.docs.base : '';
    vueConfig.outputDir = 'public';
    vueConfig.runtimeCompiler = true;
    vueConfig.productionSourceMap = false;
    const pkg = require(kubevueConfig.packagePath);

    api.chainWebpack((config) => {
        config.entryPoints.clear();
        if (kubevueConfig.type === 'library')
            config.entry('docs').add(require.resolve('../scenes/doc/views/library.js'));
        else if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block')
            // config.entry('docs').add(require.resolve('../scenes/doc/views/library.js'));
            config.entry('docs').add(require.resolve('../scenes/doc/views/material.js'));

        // Make sure vue & vue-router unique
        config.resolve.alias
            .set('vue$', require.resolve('vue/dist/vue.esm.js'))
            .set('vue-router$', require.resolve('vue-router/dist/vue-router.esm.js'));

        config.module.rule('doc-config')
            .test(/[\\/]scenes[\\/]doc[\\/]views[\\/]empty\.js$/)
            .use('auto-loader')
            .loader(autoLoaderPath)
            .options(kubevueConfig);

        const docsPath = path.resolve(process.cwd(), kubevueConfig.docsPath || 'docs');
        const docsComponentsPath = path.resolve(docsPath, 'components');
        const docsViewsPath = path.resolve(docsPath, 'views');
        const docsImportsPath = path.resolve(docsPath, 'imports.js');

        const defineOptions = {
            type: kubevueConfig.type,
            DOCS_PATH: fs.existsSync(docsPath) ? JSON.stringify(docsPath) : undefined,
            DOCS_COMPONENTS_PATH: fs.existsSync(docsComponentsPath) ? JSON.stringify(docsComponentsPath) : undefined,
            DOCS_VIEWS_PATH: fs.existsSync(docsViewsPath) ? JSON.stringify(docsViewsPath) : undefined,
            DOCS_IMPORTS_PATH: fs.existsSync(docsImportsPath) ? JSON.stringify(docsImportsPath) : undefined,
        };

        config.module.rule('doc-entry')
            .test(/[\\/]scenes[\\/]doc[\\/]views[\\/]library\.js$/)
            .use('entry-loader')
            .loader(entryLoaderPath)
            .options(defineOptions);

        // Many loaders are combined with Plugin, so thread-loader cannot be enabled.
        config.module.rule('js').uses.delete('thread-loader');

        // Eslint needs to be deleted @vue/cli-plugin-eslint
        chainMarkdown(config, config.module.rule('markdown').test(/\.md$/));

        chainMarkdown(config, config.module.rule('yaml-doc').test(/[\\/]api\.yaml$/))
            .use('yaml-doc')
            .loader(yamlDocLoaderPath);

        // No need, turn it off first
        config.optimization.splitChunks({
            cacheGroups: {
                vendors: false,
                default: false,
            },
        });

        const htmlCommonOptions = {
            chunks: 'all',
            hash: false,
            title: kubevueConfig.docs && kubevueConfig.docs.title || 'Kubevue Component Library',
            favicon: path.resolve(require.resolve('../index.js'), '../logo.png'),
        };

        if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block') {
            const componentName = kubevue.utils.kebab2Camel(path.basename(pkg.name, '.vue'));
            htmlCommonOptions.title = componentName + (kubevueConfig.title ? ' ' + kubevueConfig.title : '') + ' - Kubevue Material Platform';
        }

        // if (!Object.keys(kubevueConfig.theme).length <= 1) {
        config.plugin('html')
            .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
                filename: 'index.html',
                template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../index.html'),
            })]);
        // For history mode 404 on GitHub
        // config.plugin('html-404')
        //     .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
        //         filename: '404.html',
        //         template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../index.html'),
        //     })]);
        // } else {
        //     config.plugin('html')
        //         .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
        //             filename: 'index.html',
        //             template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../theme.html'),
        //             inject: false,
        //         })]);
        //     // config.plugin('html-404')
        //     //     .use(HTMLPlugin, [Object.assign({}, htmlCommonOptions, {
        //     //         filename: '404.html',
        //     //         template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../theme.html'),
        //     //         inject: false,
        //     //     })]);
        // }
        if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block') {
            // In dev mode, you need to extract the Cloud UI

            config.externals({
                vue: 'Vue',
                'cloud-ui.kubevue': 'CloudUI',
            });

            const pkg = require(kubevueConfig.packagePath);
            let version = '0.6.0';
            if (pkg.peerDependencies['cloud-ui.kubevue'])
                version = pkg.peerDependencies['cloud-ui.kubevue'];
            else if (pkg.dependencies['cloud-ui.kubevue'])
                version = pkg.dependencies['cloud-ui.kubevue'];
            version = version.replace(/^[^\d]+/, '').split('.').slice(0, 2).join('.');

            const docStaticURL = (kubevueConfig.docStaticURL || 'https://static-kubevue.s3.amazonaws.com').replace(/\/$/g, '');

            config.plugin('html-tags').after('html')
                .use(HTMLTagsPlugin, [
                    { tags: [
                        `${docStaticURL}/packages/vue@2/dist/vue${process.env.NODE_ENV === 'development' ? '' : '.min'}.js`,
                        `${docStaticURL}/packages/cloud-ui.kubevue@${version}/dist-theme/index.css`,
                        `${docStaticURL}/packages/cloud-ui.kubevue@${version}/dist-theme/index.js`,
                        // `${docStaticURL}/packages/cloud-ui.kubevue@${version}/dist-doc-entry/index.css`,
                        // `${docStaticURL}/packages/cloud-ui.kubevue@${version}/dist-doc-entry/index.js`,
                    ], append: false, hash: false },
                ]);
        }

        if (config.plugins.has('extract-css')) { // Build mode
            chainCSSOneOfs(config, (oneOf, modules) => {
                oneOf.use('extract-css-loader')
                    .loader(MiniCSSExtractPlugin.loader)
                    .options({
                        publicPath: '../',
                        hmr: false,
                    });
            });
            config.plugin('extract-css').use(MiniCSSExtractPlugin, [{
                filename: 'css/[name].css',
                themeFilename: 'css/[name]-theme-[theme].css',
                themes: Object.keys(kubevueConfig.theme),
            }]);
        }

        if (config.plugins.has('icon-font-plugin') && !vueConfig.publicPath) {
            config.plugin('icon-font-plugin')
                .tap(([options]) => {
                    options.publicPath = '../fonts'; // @TODO: this option is weird
                    return [options];
                });
        }

        config.plugin('define-docs')
            .use(webpack.DefinePlugin, [defineOptions]);
    });
};

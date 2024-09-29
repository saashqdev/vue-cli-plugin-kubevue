const fs = require('fs');
const path = require('path');
const chainCSSOneOfs = require('../webpack/chainCSSOneOfs');
const MiniCSSExtractPlugin = require('@kubevue/mini-css-extract-plugin');
const kubevue = require('kubevue-api');

module.exports = function registerLibraryBuild(api, vueConfig, kubevueConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('library-build', {
        description: 'Run documents server',
        usage: 'vue-cli-service library-build',
        options: Object.assign({
            '--theme': 'Which theme',
            '--kubevue-mode': 'If is "raw", remove babel-loader, icon-font-loader, css-sprite-loader, svg-classic-sprite-loader',
            '--base-css': 'Base CSS path',
            '--cache': 'Cache',
            '--output-path': 'Output path',
            '--public-path': 'Public path',
            '--src-path': 'Src path',
            '--library-path': 'Library path',
        }, buildCommand.opts.options),
    }, async (args) => {
        let cachePath;
        let versions;
        if (args.cache) {
            let cached = false;
            const cwd = process.cwd();
            const libraryPkg = require(path.join(cwd, 'package.json'));
            const kubevueDeps = Object.keys(libraryPkg.dependencies).filter((key) => key.endsWith('.kubevue'));
            versions = [libraryPkg.name + '@' + libraryPkg.version].concat(kubevueDeps.map((name) => {
                const pkg = require(path.join(cwd, `../${name}/package.json`));
                return pkg.name + '@' + pkg.version;
            })).join('\n') + '\n';

            cachePath = path.resolve(kubevueConfig.outputPath, '.version');
            if (fs.existsSync(cachePath))
                cached = fs.readFileSync(cachePath).toString() === versions;

            if (cached) {
                console.info('done.(from cache)');
                return;
            }
        }
        const pkg = require(kubevueConfig.packagePath);

        if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block') {
            vueConfig.css.extract = false;
        }

        api.chainWebpack((config) => {
            config.entryPoints.clear();
            config.entry('index').add('./index.js');

            let libraryName = kubevueConfig.CamelName || 'Library';
            if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block') {
                libraryName = kubevue.utils.kebab2Camel(path.basename(pkg.name, '.vue'));
                // htmlCommonOptions.title = componentName + (kubevueConfig.title ? ' ' + kubevueConfig.title : '') + ' - Kubevue material platform';
            }

            config.output.filename('[name].js')
                .chunkFilename('[name].[contenthash:8].js')
                .library(libraryName)
                .libraryTarget('umd')
                .umdNamedDefine(true);

            if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block') {
                config.externals({
                    vue: {
                        root: 'Vue',
                        commonjs: 'vue',
                        commonjs2: 'vue',
                        amd: 'vue',
                    },
                    'cloud-ui.kubevue': {
                        root: 'CloudUI',
                        commonjs: 'cloud-ui.kubevue',
                        commonjs2: 'cloud-ui.kubevue',
                        amd: 'cloud-ui.kubevue',
                    },
                });
            } else if (kubevueConfig.type === 'library') {
                config.externals({
                    vue: {
                        root: 'Vue',
                        commonjs: 'vue',
                        commonjs2: 'vue',
                        amd: 'vue',
                    },
                });
            }

            const cssnanoOptions = {
                preset: ['default', {
                    normalizeUrl: false,
                    calc: false,
                }],
            };

            chainCSSOneOfs(config, (oneOf, modules) => {
                oneOf.uses.has('extract-css-loader') && oneOf.use('extract-css-loader')
                    .loader(MiniCSSExtractPlugin.loader)
                    .options({
                        publicPath: './',
                        hmr: false,
                    });

                oneOf.uses.has('cssnano') && oneOf.use('cssnano')
                    .tap((options) => {
                        options.plugins[0] = require('cssnano')(cssnanoOptions);
                        return options;
                    });
            });
            config.plugins.has('extract-css') && config.plugin('extract-css')
                .use(MiniCSSExtractPlugin, [{
                    filename: '[name].css',
                    themeFilename: 'theme-[theme].css',
                    chunkFilename: '[name].[contenthash:8].css',
                    themes: Object.keys(kubevueConfig.theme),
                }]);

            // Turn off url(./img/xxx) -> url(img/xxx) processing
            config.plugins.has('optimize-css') && config.plugin('optimize-css').tap(([options]) => {
                if (!options.cssnanoOptions.preset[1])
                    options.cssnanoOptions.preset[1] = {};
                options.cssnanoOptions.preset[1].normalizeUrl = false;
                options.cssnanoOptions.preset[1].calc = false;
                return [options];
            });
            config.optimization.splitChunks({
                cacheGroups: {
                    vendors: false,
                    default: false,
                },
            });

            config.plugin('html')
                .tap(([options]) => [Object.assign(options, {
                    filename: 'demo.html',
                    template: path.resolve(require.resolve('../scenes/doc/views/library.js'), '../demo.html'),
                    title: kubevueConfig.docs && kubevueConfig.docs.title,
                    hash: true,
                    inject: 'head',
                })]);
        });

        await buildCommand.fn(args);

        if (args.cache)
            fs.writeFileSync(cachePath, versions);
    });
};

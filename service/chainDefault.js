const fs = require('fs');
const path = require('path');
const chainCSS = require('../webpack/chainCSS');
const CopyPlugin = require('copy-webpack-plugin');
const proxy = require('http-proxy-middleware');

module.exports = function chainDefault(api, vueConfig, kubevueConfig) {
    // Synchronize the information of kubevueConfig and vueConfig, try to use vueConfig as the benchmark
    if (kubevueConfig.publicPath) // If so, use './'
        vueConfig.publicPath = kubevueConfig.publicPath;
    else
        kubevueConfig.publicPath = vueConfig.publicPath;

    if (kubevueConfig.outputPath)
        vueConfig.outputDir = kubevueConfig.outputPath;
    else
        kubevueConfig.outputPath = vueConfig.outputDir;

    api.chainWebpack((config) => {
        const mode = config.get('mode');

        // Add the module path under vue-cli-plugin-kubevue context to prevent some packages from not being found
        config.resolveLoader.modules.add(path.resolve(__dirname, '../node_modules'));

        let themeCSS = kubevueConfig.theme.default;
        if (!themeCSS)
            themeCSS = kubevueConfig.theme[Object.keys(kubevueConfig.theme)[0]];

        // vue$, use default
        let alias = {
            '@': kubevueConfig.srcPath,
            '@@': kubevueConfig.libraryPath,
            library: kubevueConfig.libraryPath,
            '~': process.cwd(),
            baseCSS: kubevueConfig.baseCSSPath,
            themeCSS,
        };

        let cloudUIAlias = 'cloud-ui.kubevue';
        if (kubevueConfig.type === 'component' || kubevueConfig.type === 'block')
            cloudUIAlias = 'cloud-ui.kubevue/dist';
        else if (kubevueConfig.type === 'library') {
            cloudUIAlias = path.dirname(kubevueConfig.libraryPath);
            if (kubevueConfig.name === 'cloud-ui')
                alias['cloud-ui.kubevue'] = cloudUIAlias;
        }
        alias['cloud-ui'] = cloudUIAlias;
        // User custom
        alias = Object.assign(alias, kubevueConfig.alias);

        /**
         * Default Mode
         */
        const resolveAlias = config.resolve.alias;
        Object.keys(alias).forEach((key) => resolveAlias.set(key, alias[key]));

        config.resolve.modules.prepend('kubevue_packages');

        // @TODO: If you remove all multi-file Vue, you won’t need this loader.
        config.module.rule('vue')
            .test((filePath) => /\.vue$/.test(filePath) || /\.vue[\\/]index\.js$/.test(filePath) && !fs.existsSync(path.join(filePath, '../index.vue')))
            .use('kubevue-loader')
            .loader('kubevue-loader');

        config.module.rule('definition-loader')
            .resourceQuery(/blockType=definition/)
            .use('definition-loader')
            .loader(require.resolve('../webpack/loaders/definition-loader/index.js'));

        // config.module.rules.delete('postcss');
        // config.module.rules.delete('scss');
        // config.module.rules.delete('sass');
        // config.module.rules.delete('less');
        // config.module.rules.delete('stylus');

        chainCSS(config, vueConfig, kubevueConfig);

        const staticPath = path.resolve(process.cwd(), kubevueConfig.staticPath || './static');
        if (!fs.existsSync(staticPath))
            config.plugins.delete('copy');
        else {
            // Sometimes the original CopyPlugin cannot be found, I don’t know why.
            config.plugin('copy').use(CopyPlugin, [
                [{ from: staticPath, to: '', ignore: ['.*'] }],
            ]);
        }

        /**
         * Raw Mode
         */
        if (kubevueConfig.mode === 'raw')
            config.module.rules.delete('js');

        config.plugins.delete('case-sensitive-paths');

        /**
         * Support ifdef-loader
         * https://github.com/nippur72/ifdef-loader
         *
         * Code example that only takes effect in development
         *
         * js:
         * // #if process.env.NODE_ENV === 'development'
         * import 'test.css';
         * // #endif
         *
         * css:
         * /*
         * // #if process.env.NODE_ENV === 'development'
         * *\/
         * @import 'test.css';
         * /*
         * // #endif
         * *\/
         */
        const ifdefLoaderOptions = {
            'ifdef-verbose': true,
            'ifdef-triple-slash': false,
            'ifdef-fill-with-blanks': true,
            'ifdef-uncomment-prefix': '// #code ',
        };

        config
            .module
            .rule('js-code')
            .test(/\.(j|t)sx?$/)
            .exclude
            .add(/node_modules/)
            .end()
            .use('ifdef-loader')
            .loader('ifdef-loader')
            .options(ifdefLoaderOptions)
            .end()
            .end()
            .rule('vue')
            .use('ifdef-loader')
            .loader('ifdef-loader')
            .options(ifdefLoaderOptions)
            .end()
            .end()
            .rule('css')
            .oneOfs.store.forEach((childRule) => {
                childRule
                    .use('ifdef-loader')
                    .loader('ifdef-loader')
                    .options(ifdefLoaderOptions);
            });
    });

    // Hack for devServer options
    if (vueConfig.pluginOptions && vueConfig.pluginOptions.proxy) {
        const proxys = vueConfig.pluginOptions.proxy;
        api.configureDevServer((app) => {
            proxys.forEach((p) => {
                app.use(proxy(p.context, p));
            });
        });
    }
};

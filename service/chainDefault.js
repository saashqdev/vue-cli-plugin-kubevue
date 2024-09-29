const fs = require('fs');
const path = require('path');
const chainCSS = require('../webpack/chainCSS');
const CopyPlugin = require('copy-webpack-plugin');
const proxy = require('http-proxy-middleware');

module.exports = function chainDefault(api, vueConfig, kubevueConfig) {
    // 同步 kubevueConfig 和 vueConfig 的信息，尽量以 vueConfig 为基准
    if (kubevueConfig.publicPath) // 如果填，用'./'吧
        vueConfig.publicPath = kubevueConfig.publicPath;
    else
        kubevueConfig.publicPath = vueConfig.publicPath;

    if (kubevueConfig.outputPath)
        vueConfig.outputDir = kubevueConfig.outputPath;
    else
        kubevueConfig.outputPath = vueConfig.outputDir;

    api.chainWebpack((config) => {
        const mode = config.get('mode');

        // 添加 vue-cli-plugin-kubevue context 下的模块路径，防止有些包找不到
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

        // @TODO: 如果全部去掉多文件 Vue 的话，就不需要这个 loader 了
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
            // 有的时候找不到原来的 CopyPlugin，不知道为什么
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
         * 只在 development 才生效的代码示例
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

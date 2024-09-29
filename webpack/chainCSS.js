const path = require('path');
const IconFontPlugin = require('icon-font-loader').Plugin;
const CSSSpritePlugin = require('css-sprite-loader').Plugin;
const importGlobalLoaderPath = require.resolve('./loaders/import-global-loader');
const moduleClassPriorityLoaderPath = require.resolve('./loaders/module-class-priority-loader');
const postcssVariablesPath = require.resolve('./loaders/postcss-variables');

const getLocalIdent = require('./getLocalIdent');
const getPostcssPlugins = require('./getPostcssPlugins');
const getVariablesPostcssPlugins = require('./getVariablesPostcssPlugins');
const chainCSSOneOfs = require('./chainCSSOneOfs');

const semver = require('semver');
const isNewCSSLoader = semver.satisfies(require('css-loader/package.json').version, '>=3.0.0');
if (isNewCSSLoader) {
    const cssLoaderUtils = require('css-loader/dist/utils');
    cssLoaderUtils.normalizeUrl = function normalizeUrl(url, isStringValue) {
        isStringValue && (url = url.replace(/\\[\n]/g, ''));
        return decodeURIComponent(unescape(url)); // Remove loaderUtils.urlToRequest
    };
}

module.exports = function chainCSS(config, vueConfig, kubevueConfig) {
    const mode = config.get('mode');
    const postcssPlugins = getPostcssPlugins(config, vueConfig, kubevueConfig);

    chainCSSOneOfs(config, (oneOf, modules) => {
        const cssOptions = {
            /**
             * [icon-font-loader(, css-sprite-loader, svg-classic-sprite-loader), postcss-loader, module-class-priority-loader]
             */
            importLoaders: mode === 'production' ? 5 : 3,
            sourceMap: !!vueConfig.css.sourceMap,
        };

        if (kubevueConfig.mode === 'raw')
            cssOptions.importLoaders = 2; // [postcss-loader, module-class-priority-loader]
        if (kubevueConfig.applyTheme)
            cssOptions.importLoaders++; // +import-global-loader

        const cssOptionsModules = {
            getLocalIdent,
            localIdentName: '[name]_[local]__[hash:base64:8]',
        };

        if (modules) {
            if (isNewCSSLoader) {
                cssOptions.modules = cssOptionsModules;
            } else {
                cssOptions.modules = true;
                Object.assign(cssOptions, cssOptionsModules);
            }
        }

        oneOf.use('css-loader')
            .options(cssOptions)
            .end();

        if (kubevueConfig.mode !== 'raw') {
            mode === 'production' && oneOf.use('css-sprite-loader')
                .before('postcss-loader') // In @vue/cli-service@4, postcss-loader has been added
                .loader('css-sprite-loader')
                .end()
                .use('svg-classic-sprite-loader')
                .before('postcss-loader') // In @vue/cli-service@4, postcss-loader has been added
                .loader('svg-classic-sprite-loader')
                .options({ filter: 'query' })
                .end();

            oneOf.use('icon-font-loader')
                .before('postcss-loader') // In @vue/cli-service@4, postcss-loader has been added
                .loader('icon-font-loader')
                .end();
        }

        const postcssLoader = oneOf.use('postcss-loader')
            .loader('postcss-loader')
            .options({
                sourceMap: vueConfig.css.sourceMap,
                plugins: () => postcssPlugins,
            })
            .end()
            .use('module-class-priority-loader')
            .loader(moduleClassPriorityLoaderPath)
            .end();

        if (kubevueConfig.applyTheme) {
            postcssLoader.use('import-global-loader')
                .loader(importGlobalLoaderPath)
                .options({
                    theme: kubevueConfig.theme,
                })
                .end();
        }
    });

    const variablesPostcssPlugins = getVariablesPostcssPlugins(config, vueConfig, kubevueConfig);
    config.module.rule('css').oneOf('variables')
        .resourceQuery(/variables/)
        .use('postcss-variables')
        .loader(postcssVariablesPath)
        .end()
        .use('postcss-loader')
        .loader('postcss-loader')
        .options({ plugins: () => variablesPostcssPlugins })
        .end()
        .use('import-global-loader')
        .loader(importGlobalLoaderPath)
        .options({
            theme: kubevueConfig.theme,
        })
        .end()
        .__before = 'normal';

    if (kubevueConfig.mode !== 'raw') {
        config.plugin('icon-font-plugin')
            .use(IconFontPlugin, [{
                fontName: kubevueConfig.name ? kubevueConfig.name + '-icon' : 'kubevue-icon',
                filename: '[name].[hash:16].[ext]',
                output: path.join(vueConfig.assetsDir, 'fonts'),
                mergeDuplicates: mode === 'production',
                smartSelector: true,
            }]);

        mode === 'production' && config.plugin('css-sprite-plugin')
            .use(CSSSpritePlugin, [{
                imageSetFallback: true,
                plugins: postcssPlugins,
            }]);
    }

    // In order to handle the secondary packaging, add two hashes
    if (kubevueConfig.mode === 'raw') {
        config.module.rule('images').use('url-loader').tap((options) => {
            options.fallback.options.name = 'img/[hash:8]/[name].[ext]';
            return options;
        });
        config.module.rule('svg').use('file-loader').tap((options) => {
            options.name = 'img/[hash:8]/[name].[ext]';
            return options;
        });
        config.module.rule('media').use('url-loader').tap((options) => {
            options.fallback.options.name = 'media/[hash:8]/[name].[ext]';
            return options;
        });
        config.module.rule('fonts').use('url-loader').tap((options) => {
            options.fallback.options.name = 'fonts/[hash:8]/[name].[ext]';
            return options;
        });
    }
};

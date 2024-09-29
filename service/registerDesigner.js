const predesigner = require('./predesigner');
const EventHooksWebpackPlugin = require('event-hooks-webpack-plugin');
const { CallbackTask } = require('event-hooks-webpack-plugin/lib/tasks');
const path = require('path');

module.exports = function registerDesigner(api, vueConfig, kubevueConfig, args) {
    if (args._[0] === 'designer') {
        process.env.DESIGNER = true;
        process.env.VUE_APP_DESIGNER = true;
        vueConfig.devServer.open = false;

        vueConfig.pages = {
            designer: {
                entry: [require.resolve('../scenes/app/index.js'), require.resolve('../scenes/designer/views/index.js')],
                filename: 'designer.html',
                template: path.resolve(require.resolve('../scenes/app/index.js'), '../index.html'),
                inject: true,
                chunks: [
                    'chunk-vendors',
                    'designer',
                ],
                chunksSortMode: 'manual',
            },
        };

        // Front-end brute force replacement to prevent restart problems
        predesigner();
        // npx vue-cli-service designer --pre
        args.pre && process.exit();
    }

    const serveCommand = api.service.commands.serve;

    api.registerCommand('designer', {
        description: 'Run designer server for kubevue-vscode',
        usage: 'vue-cli-service designer',
        options: serveCommand.opts.options,
    }, (args) => {
        process.env.NODE_ENV = 'development';

        vueConfig.devServer = vueConfig.devServer || {};
        vueConfig.devServer.port = 12800;
        vueConfig.devServer.watchOptions = Object.assign({}, vueConfig.devServer.watchOptions, {
            poll: true,
        });

        vueConfig.runtimeCompiler = true;
        vueConfig.productionSourceMap = false;

        api.chainWebpack((config) => {
            config.devtool('eval');

            config.plugin(`designer-dll`).tap((args) => {
                args[0].files = ['designer.html'];
                return args;
            });
            config.plugin('html-index').use(EventHooksWebpackPlugin, [
                {
                    emit: new CallbackTask((compilation, done) => {
                        done();
                    }),
                },
            ]);

            // config.module.rule('designer-config')
            //     .test(/vue-cli-plugin-kubevue[\\/]scenes[\\/]designer[\\/]views[\\/]empty\.js$/)
            //     .use('auto-loader')
            //     .loader(autoLoaderPath)
            //     .options(kubevueConfig);

            //     const defineOptions = {
            //         type: kubevueConfig.type,
            //         DOCS_PATH: fs.existsSync(docsPath) ? JSON.stringify(docsPath) : undefined,
            //         DOCS_COMPONENTS_PATH: fs.existsSync(docsComponentsPath) ? JSON.stringify(docsComponentsPath) : undefined,
            //         DOCS_VIEWS_PATH: fs.existsSync(docsViewsPath) ? JSON.stringify(docsViewsPath) : undefined,
            //         DOCS_IMPORTS_PATH: fs.existsSync(docsImportsPath) ? JSON.stringify(docsImportsPath) : undefined,
            //     };

            // Many loaders are combined with Plugin, so thread-loader cannot be enabled.
            config.module.rule('js').uses.delete('thread-loader');
            // There seems to be a problem if dev and designer server are run at the same time.
            config.module.rule('js').uses.delete('cache-loader');
            config.module.rule('vue').uses.delete('cache-loader');
            config.module.rule('vue').use('vue-loader').tap((options) => {
                // options.compiler = require('../scenes/designer/fork/build');
                options.cacheDirectory = options.cacheDirectory.replace('.cache', '.decache');
                options.compilerOptions.plugins = [require('../scenes/designer/transform').compilerPlugin];
                return options;
            });

            // fs.writeFileSync('./test.log', config.toString());
            // process.exit(0);
        //     config.plugin('define-docs')
        //         .use(webpack.DefinePlugin, [defineOptions]);
        });
        return serveCommand.fn(args);
    });
};

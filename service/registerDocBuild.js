const chainDoc = require('./chainDoc');
const HTMLTagsPlugin = require('html-webpack-tags-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = function registerDocBuild(api, vueConfig, kubevueConfig) {
    const buildCommand = api.service.commands.build;

    api.registerCommand('doc-build', {
        description: 'Build documentation',
        usage: 'vue-cli-service doc-build',
        options: buildCommand.opts.options,
    }, (args) => {
        chainDoc(api, vueConfig, kubevueConfig);

        // Cloud UI is extracted when packaging
        api.chainWebpack((config) => {
            config.externals({
                vue: 'Vue',
                'cloud-ui.kubevue': 'CloudUI',
            });

            if (kubevueConfig.type === 'library') {
                config.plugin('copy-dist')
                    .use(CopyPlugin, [[
                        { from: './dist', to: 'dist', ignore: ['.*'] },
                        { from: './dist-theme', to: 'dist-theme', ignore: ['.*'] },
                    ]]);

                const docStaticURL = (kubevueConfig.docStaticURL || 'https://static-kubevue.s3.amazonaws.com').replace(/\/$/g, '');
                config.plugin('html-tags').after('html')
                    .use(HTMLTagsPlugin, [
                        { tags: [
                            'dist-theme/index.css',
                            { path: `${docStaticURL}/packages/vue@2/dist/vue.min.js`, hash: false },
                            'dist-theme/index.js',
                        ], append: false, hash: true },
                    ]);
            }
        });

        return buildCommand.fn(args);
    });
};

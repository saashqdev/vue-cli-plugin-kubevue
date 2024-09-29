const kubevue = require('kubevue-api');

const chainDefault = require('./service/chainDefault');
const registerLibraryBuild = require('./service/registerLibraryBuild');
const registerDoc = require('./service/registerDoc');
const registerDocBuild = require('./service/registerDocBuild');
const registerDesigner = require('./service/registerDesigner');

module.exports = function (api, vueConfig) {
    // 需要提前知晓 theme, mode 等信息
    const args = require('minimist')(process.argv.slice(2), {
        boolean: ['apply-theme'],
        alias: {
            o: 'output-path',
        },
    });

    const configPath = args['kubevue-config'] || process.env.VUSION_CONFIG_PATH;
    const kubevueConfig = kubevue.config.resolve(process.cwd(), configPath, args);

    chainDefault(api, vueConfig, kubevueConfig);
    registerLibraryBuild(api, vueConfig, kubevueConfig);
    registerDoc(api, vueConfig, kubevueConfig);
    registerDocBuild(api, vueConfig, kubevueConfig);
    registerDesigner(api, vueConfig, kubevueConfig, args);
};

module.exports.defaultModes = {
    'library-build': 'production',
    doc: 'development',
    'doc-build': 'production',
    designer: 'development',
};

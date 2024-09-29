const chainDoc = require('./chainDoc');

module.exports = function registerDoc(api, vueConfig, kubevueConfig) {
    const serveCommand = api.service.commands.serve;

    api.registerCommand('doc', {
        description: 'Run documentation server',
        usage: 'vue-cli-service doc',
        options: serveCommand.opts.options,
    }, (args) => {
        chainDoc(api, vueConfig, kubevueConfig);
        return serveCommand.fn(args);
    });
};

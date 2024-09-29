const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const _ = require('../../../webpack/loaders/routes-loader/utils');

const RESERVED_DIRS = [
    'layout',
    'assets',
    'components',
    'directives',
    'filters',
    'mixins',
    'utils',
    'styles',
    'service',
    'module',
];

const normalize = (routePath) => routePath
    .replace(/(^|\/)views\//g, '$1/')
    .replace(/(^|\/)_/g, '$1:')
    .replace(/_($|\/)/g, '?$1')
    .replace(/\$/g, '*');

// Generate routes in the form of string concatenation
module.exports = function (content) {
    const config = loaderUtils.getOptions(this);
    this.cacheable();
    // The cost of dynamically monitoring directory changes is too high. It is best to only monitor directory changes.
    // this.addContextDependency(srcPath || libraryPath);
    // @TODO: Dynamically monitor configuration changes
    this.addDependency(config.packagePath);

    const resourceDir = path.dirname(this.resourcePath);

    // Dynamically generate routes
    const srcPath = config.srcPath;
    const viewsPath = path.resolve(srcPath, 'views');
    this.addContextDependency(viewsPath);
    const flatRoutes = _.getFlatRoutes(viewsPath, {
        excludes: RESERVED_DIRS.map((dir) => `/${dir}/`),
    });

    const handledFlatRoutes = {};
    Object.keys(flatRoutes).map((key) => {
        const route = flatRoutes[key];

        route.routePath = key = normalize(key);
        route.path = normalize(route.path);
        route.parentPath = normalize(route.parentPath);
        route.filePath = './' + path.relative(resourceDir, path.join(viewsPath, route.filePath));
        // route.chunkName = options.chunkName;

        handledFlatRoutes[key] = route;

        return route;
    });
    if (!handledFlatRoutes[''])
        _.createRoute('', handledFlatRoutes, true);

    const routes = Object.keys(flatRoutes).map((key) => {
        const route = flatRoutes[key];
        route.path = key.replace(/\/views(\/|$)/, '$1').replace(/^\/?/, '/');
        return route;
    });

    const outputs = [];

    const $designer = {};

    outputs.push('const $designer = ' + JSON.stringify($designer));
    outputs.push('$designer.routes = ' + _.renderRoutes(routes));
    outputs.push('export default $designer');
    return outputs.join(';\n');
};

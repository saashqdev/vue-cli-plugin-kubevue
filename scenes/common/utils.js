const fs = require('fs');
const path = require('path');
const globby = require('globby');

const kebab2Camel = (name) => name.replace(/(?:^|-)([a-zA-Z0-9])/g, (m, $1) => $1.toUpperCase());

function createRoute(routePath, flatRoutes) {
    if (!routePath)
        routePath = '/';
    if (flatRoutes[routePath])
        return flatRoutes[routePath];

    let [m, parentPath, currentPath] = routePath.match(/(.*)\/(.*)/);
    if (routePath === '/')
        currentPath = '/';
    if (!parentPath)
        parentPath = '/';

    return flatRoutes[routePath] = {
        path: currentPath,
        parentPath,
        routePath,
    };
}

/**
 * Basic file routing for flat file management
 * {
 * '/aaa/',
 * '/aaa/bbb',
 * }
 */
exports.getFlatRoutes = function (basePath) {
    // Here we can directly generate each level of routing when recursing the directory.
    // But now we use to get all the flat routes, in order to facilitate configuration and merging.
    const flatRoutes = {};
    globby.sync(['**/*.{vue,md}', '!**/*.vue/docs/*.md', '!**/*.blocks/**'], { cwd: basePath }).forEach((filePath) => {
        filePath = filePath.replace(/\\/g, '/');
        const routePath = ('/' + filePath).replace(/(\/index)?\.(vue|md)$/, '') || '/';

        const route = createRoute(routePath, flatRoutes);
        route.filePath = filePath;
        route.fullPath = path.join(basePath, filePath);
    });

    return flatRoutes;
};

const _mergeFlatRoutes = function (routes1, routes2) {
    if (!routes2)
        return routes1;
    Object.keys(routes2).forEach((key) => {
        routes1[key] = routes1[key] ? Object.assign(routes1[key], routes2[key]) : routes2[key];
    });
    return routes1;
};
/**
 * Merge flat routing
 */
exports.mergeFlatRoutes = (...args) => args.reduceRight((acc, cur) => _mergeFlatRoutes(cur, acc));

/**
 * Convert flat routes to nested routes for normal use
 */
exports.nestRoutes = function (flatRoutes) {
    const routes = [];

    const parse = function (route) {
        if (route.routePath === '/')
            return;

        let parent = flatRoutes[route.parentPath];
        if (!parent) {
            parent = createRoute(route.parentPath, flatRoutes);
            try {
                parent.fullPath = parent.filePath = require.resolve('cloud-ui.kubevue/src/layouts/l-wrapper.vue/index.js').replace(/\\/g, '/');
            } catch (e) {
                parent.fullPath = parent.filePath = require.resolve(path.resolve(process.cwd(), './src/layouts/l-wrapper.vue/index.js')).replace(/\\/g, '/');
            }
            parse(parent);
        }

        parent.children = parent.children || [];
        parent.children.push(route);
    };

    Object.keys(flatRoutes).forEach((key) => parse(flatRoutes[key]));
    // Replenish
    Object.keys(flatRoutes).forEach((key) => {
        const route = flatRoutes[key];
        if (route.children && !!route.children[0].path)
            route.children.unshift({ path: '', redirect: route.children[0].path });
    });
    routes.push(flatRoutes['/'], { path: '*', redirect: '/' });

    return routes;
};

/**
 * Concatenate into JS string
 */
exports.renderRoutes = function (routes) {
    return '[\n' + routes.map((route) => {
        const properties = [];
        properties.push(`path: '${route.path}'`);
        /* eslint-disable multiline-ternary */
        route.fullPath && properties.push(route.chunkName
            ? `component: () => import(/* webpackChunkName: "${route.chunkName}" */ '${route.fullPath.replace(/\\/g, '/')}')`
            : `component: require('${route.fullPath.replace(/\\/g, '/')}').default`);
        route.children && properties.push(`children: ${exports.renderRoutes(route.children)}`);
        route.redirect && properties.push(`redirect: '${route.redirect}'`);
        route.alias && properties.push(`alias: '${route.alias}'`);
        return `{ ${properties.join(', ')} }`;
    }).join(',\n') + '\n]\n';
};

function ensureReadmePath(markdownPath) {
    if (!markdownPath.endsWith('/README.md')) // @multi: if (!markdownPath.endsWith('.vue/README.md'))
        return markdownPath;

    const yamlPath = path.join(markdownPath, '../api.yaml').replace(/\\/g, '/');
    if (fs.existsSync(yamlPath))
        return yamlPath;

    return markdownPath;
}

exports.normalizeMaterials = function (basePath, materials, type) {
    const isComponentsType = ['components', 'blocks', 'vendors', 'layouts'].includes(type);

    materials.forEach((material) => {
        const relativeReadmePath = (material.scope ? `@${material.scope}/` : '') + material.name + (isComponentsType ? '/README.md' : '/README.md');

        if (material.path) {
            if (material.path[0] === '.')
                material.path = path.join(process.cwd(), material.path).replace(/\\/g, '/');
            else {
                // @compat:
                let libraryPath = basePath;
                if (basePath.endsWith(type))
                    libraryPath = path.dirname(basePath);
                material.path = material.path.replace(/^library/, libraryPath).replace(/^@/, process.cwd());
            }
        } else if (!material.href && !material.to)
            material.path = ensureReadmePath(path.resolve(basePath, relativeReadmePath).replace(/\\/g, '/'));

        if (material.path) {
            // Only verify full path
            if (path.isAbsolute(material.path) && !fs.existsSync(material.path)) {
                material.path = '';
                // @TODO: Temporary solution, generally only extended from cloud-ui
                let depMarkdownPath;
                if (type !== 'vendors')
                    depMarkdownPath = ensureReadmePath(path.resolve(basePath, `../../node_modules/cloud-ui.kubevue/src/${type}/` + relativeReadmePath).replace(/\\/g, '/'));
                else
                    depMarkdownPath = ensureReadmePath(path.resolve(basePath, `../../node_modules/cloud-ui.kubevue/node_modules/` + relativeReadmePath).replace(/\\/g, '/'));
                if (fs.existsSync(depMarkdownPath))
                    material.path = depMarkdownPath;
            }

            const absolutePath = path.isAbsolute(material.path) || material.path[0] === '.' ? path.resolve(material.path) : path.resolve('node_modules', material.path);
            // subDocs
            const subDocsPath = path.join(absolutePath, '../docs');

            const subDocsExists = fs.existsSync(subDocsPath);
            const pathIsYaml = material.path.endsWith('/api.yaml'); // @multi: material.path.endsWith('.vue/api.yaml');
            if (subDocsExists || pathIsYaml) {
                material.children = [];

                if (subDocsExists) {
                    const subDocs = fs.readdirSync(subDocsPath);
                    subDocs.forEach((name) => {
                        if (name !== 'index.md' && name.endsWith('.md')) {
                            material.children.push({
                                path: name.replace(/\.md$/, ''),
                                fullPath: path.resolve(subDocsPath, name),
                            });
                        }
                    });
                }
                if (pathIsYaml) {
                    material.children.push({
                        path: 'api',
                        fullPath: material.path + '?yaml-doc=api',
                    });
                }
                const changelogPath = path.join(absolutePath, '../CHANGELOG.md');
                if (fs.existsSync(changelogPath)) {
                    material.children.push({
                        path: 'changelog',
                        fullPath: changelogPath,
                    });
                }

                // Design the first route as the default redirect
                if (material.children[0] && !!material.children[0].path) {
                    if (material.children.find((route) => route.path === 'examples'))
                        material.children.unshift({ path: '', redirect: 'examples' });
                    else
                        material.children.unshift({ path: '', redirect: material.children[0].path });
                }
            }
        }

        material.CamelName = kebab2Camel(material.name); // .replace(/^u-/, ''));
    });

    return materials;
};

exports.getMaterials = function (basePath, materials, type) {
    const isComponentsType = ['components', 'blocks', 'vendors', 'layouts'].includes(type);

    if (!materials) { // If there is no materials in the configuration, it will be generated based on the directory.
        if (isComponentsType) {
            const materialsMap = {};

            // components in catalog
            globby.sync(['*'], { cwd: basePath })
                .forEach((fileName) => {
                    const vueName = fileName.slice(0, -4);
                    const markdownPath = path.resolve(basePath, fileName + '/README.md').replace(/\\/g, '/');
                    materialsMap[vueName] = {
                        name: vueName,
                        path: ensureReadmePath(markdownPath),
                    };
                });

            materials = Object.keys(materialsMap).map((vueName) => materialsMap[vueName]);
        } else
            return [];
    }

    exports.normalizeMaterials(basePath, materials, type);

    return materials;
};

exports.getMaterial = function (srcPath, type) {
    const isComponentsType = ['components', 'blocks', 'vendors', 'layouts'].includes(type);

    let materials = [];
    const materialsMap = {};

    // components in catalog
    const fileName = path.basename(srcPath);
    const vueName = fileName.replace(/\.vue$/, ''); // @multi: filePath.slice(0, -4);
    const markdownPath = path.resolve(srcPath + '/README.md').replace(/\\/g, '/');
    materialsMap[vueName] = {
        name: vueName,
        path: ensureReadmePath(markdownPath),
    };

    materials = Object.keys(materialsMap).map((vueName) => materialsMap[vueName]);

    exports.normalizeMaterials(srcPath, materials, type);

    return materials;
};

exports.groupMaterials = function (materials) {
    const groupsMap = {};
    materials.forEach((material) => {
        material.group = material.group || '';
        if (!groupsMap[material.group])
            groupsMap[material.group] = { name: material.group, children: [] };
        groupsMap[material.group].children.push(material);
    });
    return Object.keys(groupsMap).map((key) => groupsMap[key]);
};

exports.setChildren = function (route, materials) {
    route.children = materials.filter((material) => !!material.path).map((material) => ({
        path: material.name,
        fullPath: material.path,
        children: material.children,
        chunkName: (material.group || '').replace(/\s+/g, '_'),
    }));
    // Add default jump path
    if (route.children && route.children[0] && !!route.children[0].path)
        route.children.unshift({ path: '', redirect: route.children[0].path });
};

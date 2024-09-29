module.exports = (api) => {
    api.describeConfig({
        // Unique ID for the config
        id: 'org.kubevue',
        // Displayed name
        name: 'Kubevue',
        // Shown below the name
        description: 'Kubevue 配置',
        // "More info" link
        link: 'https://github.com/kubevue/vue-cli-plugin-kubevue',
        icon: 'settings',
        files: {
            // vue: {
            //     js: ['vue.config.js'],
            // },
            kubevue: {
                js: ['kubevue.config.js'],
            },
        },

        // other config properties
        onRead: ({ data, cwd }) => ({
            prompts: [{
                name: 'type',
                message: '项目类型',
                type: 'list',
                default: '',
                value: data.kubevue.type,
                description: 'Kubevue 项目类型。',
                group: '基础设置',
                choices: [{
                    name: 'Web 应用',
                    value: 'app',
                }, {
                    name: '组件库',
                    value: 'library',
                }, {
                    name: '组件',
                    value: 'component',
                }, {
                    name: '区块',
                    value: 'block',
                }, {
                    name: '物料仓库',
                    value: 'repository',
                }],
            }, {
                name: 'outputPath',
                message: '输出目录',
                type: 'input',
                default: '',
                value: data.kubevue.outputPath,
                description: '构建产生的文件将会生成在这里。如果设置，会覆盖 Vue CLI 的配置。',
                group: '基础设置',
            }, {
                name: 'publicPath',
                message: '公共路径',
                type: 'input',
                default: '',
                value: data.kubevue.publicPath,
                description: `应用的部署地址。如'/my-app/'。如果设置，会覆盖 Vue CLI 的配置。`,
                group: '基础设置',
            }, {
                name: 'staticPath',
                message: '静态资源目录',
                type: 'input',
                default: '',
                value: data.kubevue.staticPath,
                description: `构建时，会将该目录中的资源全部原样拷贝到输出目录下。`,
                group: '基础设置',
            }, {
                name: 'srcPath',
                message: '源文件目录',
                type: 'input',
                default: './src',
                value: data.kubevue.srcPath,
                description: `源文件目录。在项目中会自动注册别名'@'。`,
                group: '基础设置',
            }, {
                name: 'libraryPath',
                message: '项目库目录',
                type: 'input',
                default: '',
                value: data.kubevue.libraryPath,
                description: `项目库目录。默认留空，表示与'srcPath'一致。在项目中会自动注册别名'@@'。`,
                group: '基础设置',
            }, {
                name: 'baseCSSPath',
                message: '基础样式路径',
                type: 'input',
                default: '',
                value: data.kubevue.baseCSSPath,
                description: `基础样式（如 reset 样式）的路径。默认留空，会查找'@/base/base.css'。在项目中会自动注册别名'baseCSS'。`,
                group: '基础设置',
            }, {
                name: 'theme',
                message: '设置主题',
                type: 'input',
                default: undefined,
                value: data.kubevue.theme,
                description: `主题 CSS 所在的路径，主题名称为 CSS 名。也可以为一个对象。`,
                group: '基础设置',
            }, {
                name: 'applyTheme',
                message: '应用主题',
                type: 'confirm',
                default: false,
                value: data.kubevue.applyTheme,
                description: `将主题变量注入到 CSS 中。如果需要兼容 IE 浏览器，必须开启。`,
                group: '基础设置',
            }],
        }),

        async onWrite({ data, prompts, api }) {
            const result = {};
            await Promise.all(prompts.map((prompt) => api.getAnswer(prompt.id)
                .then((answer) => result[prompt.id] = answer)));
            api.assignData('kubevue', result);
        },
    });

    api.describeTask({
        match: /vue-cli-service library-build.+?--kubevue-mode raw/,
        description: '构建库（原生模式，不处理 babel、font、sprite 等）',
        icon: 'archive',
        // link:
    });

    api.describeTask({
        match: /vue-cli-service library-build(\s|$)/,
        description: '构建库',
        icon: 'archive',
        // link:
    });

    api.describeTask({
        match: /vue-cli-service doc(\s|$)/,
        description: '开发文档',
        icon: 'photo',
        // link:
    });

    api.describeTask({
        match: /vue-cli-service doc-build(\s|$)/,
        description: '构建文档',
        icon: 'photo_album',
        // link:
    });
};

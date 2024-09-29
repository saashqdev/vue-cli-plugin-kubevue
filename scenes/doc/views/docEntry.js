import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import CodeExamplePlugin from './CodeExamplePlugin';
Vue.use(CodeExamplePlugin);

import { install } from '@kubevue/utils';

import 'themeCSS';
import '../styles/vue-package.css';
import * as CloudUI from 'cloud-ui.kubevue';
install(Vue, CloudUI);

// Automatically register local components
const requires = require.context('../components/', true, /\.vue$/);
requires.keys().forEach((key) => {
    if (key.indexOf('.vue') !== key.lastIndexOf('.vue'))
        return;
    const name = requires(key).default.name || key.slice(key.lastIndexOf('/') + 1, key.lastIndexOf('.'));
    Vue.component(name, requires(key).default);
});

export default ($docs, Components, NODE_ENV) => {
    Vue.prototype.$docs = $docs;
    Vue.prototype.NODE_ENV = NODE_ENV;
    if (process.env.NODE_ENV === 'development')
        window.$docs = $docs; // Facilitates debugging during development

    install(Vue, Components);
    if (Components.default) {
        const name = ((packageName) => {
            const cap = /([a-zA-Z0-9-_]+)(\.vue)?$/.exec(packageName);
            return (cap ? cap[1] : packageName).replace(/(?:^|-)([a-zA-Z0-9])/g, (m, $1) => $1.toUpperCase());
        })($docs.package.name);
        install(Vue, { [name]: Components.default });
    }

    const router = new VueRouter({
        mode: $docs.mode,
        base: $docs.base,
        routes: $docs.routes,
        scrollBehavior: (to, from, savedPosition) => {
            if (to.hash) {
                return {
                    selector: decodeURIComponent(to.hash),
                };
            }
            return savedPosition || { x: 0, y: 0 };
        },
    });
    router.afterEach((to, from) => {
        if (to.hash) {
            setTimeout(() => {
                const el = document.querySelector(decodeURIComponent(to.hash));
                // Handle navigation bar height
                const navbarEl = document.querySelector('[class^=u-navbar]');
                document.documentElement.scrollTop = (el ? el.offsetTop : 0) - (navbarEl ? navbarEl.offsetHeight : 0) - 30;
            }, 300); // The delay time cannot be determined, temporarily 300ms
        }
    });

    new Vue({
        router,
    }).$mount('#app');
};

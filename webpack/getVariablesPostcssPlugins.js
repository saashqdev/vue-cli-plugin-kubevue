const postcssImportResolver = require('postcss-import-resolver');
const postcssKubevueExtendMark = require('./postcss/extend-mark');
const postcssKubevueExtendMerge = require('./postcss/extend-merge');

const map2obj = ((map) => {
    const obj = {};
    map.forEach((value, key) => { obj[key] = value; });
    return obj;
});

module.exports = function getVariablesPostcssPlugins(config) {
    const alias = map2obj(config.resolve.alias.store);
    const postcssExtendMark = postcssKubevueExtendMark({
        resolve: postcssImportResolver({
            extensions: ['.js'],
            alias,
        }),
    });
    return [
        postcssExtendMark,
        require('postcss-import')({
            resolve: postcssImportResolver({
                alias,
            }),
            skipDuplicates: false,
            plugins: [postcssExtendMark],
        }),
        require('postcss-variables'),
        postcssKubevueExtendMerge,
        require('./postcss/custom-properties-reader'),
        require('@kubevue/postcss-calc'),
        require('./postcss/custom-properties-reader/get-custom-properties-computed'),
    ];
};

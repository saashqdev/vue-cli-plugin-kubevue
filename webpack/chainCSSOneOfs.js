module.exports = function chainCSSOneOfs(config, chainOneOf) {
    // 'postcss' is left to user customization
    ['css', 'scss', 'sass', 'less', 'stylus'].forEach((rule) => {
        const ruleCSS = config.module.rule(rule);
        chainOneOf(ruleCSS.oneOf('vue-modules'), true);
        chainOneOf(ruleCSS.oneOf('vue'), false);
        chainOneOf(ruleCSS.oneOf('normal-modules'), true);
        chainOneOf(ruleCSS.oneOf('normal'), false);
    });
};

const antfu = require('@antfu/eslint-config').default
const unocss = require('@unocss/eslint-plugin')

module.exports = antfu(
  {
    rules: {
      'no-console': 'off',
      'node/prefer-global/process': 'off',
      'vue/custom-event-name-casing': 'off',
      'vue/component-name-in-template-casing': 'off',
      'vue/require-toggle-inside-transition': 'off',
    },
  },
  unocss.configs.flat,
)

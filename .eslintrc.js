const process = require('node:process')

process.env.ESLINT_TSCONFIG = 'tsconfig.json'

module.exports = {
  extends: ['@xingyuv', '@unocss'],
  rules: {
    'no-console': 'off',
    'vue/custom-event-name-casing': 'off',
  },
}

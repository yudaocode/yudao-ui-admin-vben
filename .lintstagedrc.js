// .lintstagedrc.js
module.exports = {
  '*.js': ['prettier --config prettier.config.js --write', 'eslint --fix --ext .js'],
  '*.ts': ['prettier --config prettier.config.js --write', 'eslint --fix --ext .ts'],
  '*.vue': ['prettier --config prettier.config.js --write', 'eslint --fix --ext .vue'],
  '*.tsx': ['prettier --config prettier.config.js --write', 'eslint --fix --ext .tsx'],
  '*.json': 'prettier --config prettier.config.js --write'
}

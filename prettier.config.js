module.exports = {
  // 一行代码的最大字符数，默认是80
  printWidth: 140,
  // tab宽度为2空格
  tabWidth: 2,
  // 使用tab缩进，默认false
  useTabs: false,
  // 结尾是否添加分号, 默认true
  semi: false,
  // vue script和style标签中是否缩进,开启可能会破坏编辑器的代码折叠
  vueIndentScriptAndStyle: false,
  // 使用单引号, 默认false(在jsx中配置无效, 默认都是双引号)
  singleQuote: true,
  // object对象中key值是否加引号 as-needed只有在需求要的情况下加引号，consistent是有一个需要引号就统一加，preserve是保留用户输入的引号
  quoteProps: 'as-needed',
  // object对象里面的key和value值和括号间的空格
  bracketSpacing: true,
  // 行尾逗号,默认none,可选 none|es5|all
  // es5 包括es5中的数组、对象
  // all 包括函数对象等所有可选
  trailingComma: 'none',
  // 在jsx文件中的引号需要单独设置 默认false
  jsxSingleQuote: false,
  // 箭头函数单个参数的情况是否省略括号，默认always是总是带括号
  // avoid 能省略括号的时候就省略 例如x => x
  // always 总是有括号
  arrowParens: 'always',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'never',
  htmlWhitespaceSensitivity: 'strict',
  // endOfLine: "<lf|crlf|cr|auto>" 行尾换行符,默认是lf
  endOfLine: 'auto',
  // range是format执行的范围，可以选执行一个文件的一部分，默认的设置是整个文件
  rangeStart: 0,
  rangeEnd: Infinity
}

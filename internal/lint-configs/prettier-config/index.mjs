export default {
  endOfLine: 'auto',
  overrides: [
    {
      files: ['*.json5'],
      options: {
        quoteProps: 'preserve',
        singleQuote: false,
      },
    },
  ],
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 100, // 默认 80 字符，调整为 100 更合适 https://yuanbao.tencent.com/bot/app/share/chat/38E19MAIFdGr
  proseWrap: 'never',
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
};

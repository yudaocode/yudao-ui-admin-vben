import { defHttp } from '@/utils/http/axios'

// 导出Html
export const exportHtmlApi = () => {
  return defHttp.download({ url: '/infra/db-doc/export-html' }, '数据库.html')
}

// 导出Word
export const exportWordApi = () => {
  return defHttp.download({ url: '/infra/db-doc/export-word' }, '数据库.doc')
}

// 导出Markdown
export const exportMarkdownApi = () => {
  return defHttp.download({ url: '/infra/db-doc/export-markdown' }, '数据库.md')
}

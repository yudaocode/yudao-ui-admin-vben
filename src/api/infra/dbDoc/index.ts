import { defHttp } from '@/utils/http/axios'

// 导出Html
export const exportHtmlApi = () => {
  return defHttp.download({ url: '/infra/db-doc/export-html' })
}

// 导出Word
export const exportWordApi = () => {
  return defHttp.download({ url: '/infra/db-doc/export-word' })
}

// 导出Markdown
export const exportMarkdownApi = () => {
  return defHttp.download({ url: '/infra/db-doc/export-markdown' })
}

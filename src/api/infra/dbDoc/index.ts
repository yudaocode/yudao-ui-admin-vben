import { defHttp } from '@/utils/http/axios'

// 导出Html
export const exportHtmlApi = async () => {
  return defHttp.get({ url: '/infra/db-doc/export-html', responseType: 'blob' })
}

// 导出Word
export const exportWordApi = () => {
  return defHttp.get({ url: '/infra/db-doc/export-word', responseType: 'blob' })
}

// 导出Markdown
export const exportMarkdownApi = () => {
  return defHttp.get({ url: '/infra/db-doc/export-markdown', responseType: 'blob' })
}

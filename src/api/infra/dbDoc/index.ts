import { defHttp } from '@/utils/http/axios'

// 导出Html
export function exportHtml() {
  return defHttp.get({ url: '/infra/db-doc/export-html', responseType: 'blob' })
}

// 导出Word
export function exportWord() {
  return defHttp.get({ url: '/infra/db-doc/export-word', responseType: 'blob' })
}

// 导出Markdown
export function exportMarkdown() {
  return defHttp.get({ url: '/infra/db-doc/export-markdown', responseType: 'blob' })
}

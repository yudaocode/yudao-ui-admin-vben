import { defHttp } from '@/utils/http/axios'

// 导出Html
export function exportHtmlApiasync() {
  return defHttp.get({ url: '/infra/db-doc/export-html', responseType: 'blob' })
}

// 导出Word
export function exportWordApi() {
  return defHttp.get({ url: '/infra/db-doc/export-word', responseType: 'blob' })
}

// 导出Markdown
export function exportMarkdownApi() {
  return defHttp.get({ url: '/infra/db-doc/export-markdown', responseType: 'blob' })
}

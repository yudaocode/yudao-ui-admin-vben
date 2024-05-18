import { defHttp } from '@/utils/http/axios'

// 查询示例分类列表
export function getDemo02CategoryPage(params) {
  return defHttp.get({ url: '/infra/demo02-category/page', params })
}

// 查询示例分类详情
export function getDemo02Category(id: number) {
  return defHttp.get({ url: `/infra/demo02-category/get?id=${id}` })
}

// 新增示例分类
export function createDemo02Category(data) {
  return defHttp.post({ url: '/infra/demo02-category/create', data })
}

// 修改示例分类
export function updateDemo02Category(data) {
  return defHttp.put({ url: '/infra/demo02-category/update', data })
}

// 删除示例分类
export function deleteDemo02Category(id: number) {
  return defHttp.delete({ url: `/infra/demo02-category/delete?id=${id}` })
}

// 导出示例分类 Excel
export function exportDemo02Category(params) {
  return defHttp.download({ url: '/infra/demo02-category/export-excel', params }, '示例分类.xls')
}

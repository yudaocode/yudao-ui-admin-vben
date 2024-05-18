import { defHttp } from '@/utils/http/axios'

// 查询示例联系人列表
export function getDemo01ContactPage(params) {
  return defHttp.get({ url: '/infra/demo01-contact/page', params })
}

// 查询示例联系人详情
export function getDemo01Contact(id: number) {
  return defHttp.get({ url: `/infra/demo01-contact/get?id=${id}` })
}

// 新增示例联系人
export function createDemo01Contact(data) {
  return defHttp.post({ url: '/infra/demo01-contact/create', data })
}

// 修改示例联系人
export function updateDemo01Contact(data) {
  return defHttp.put({ url: '/infra/demo01-contact/update', data })
}

// 删除示例联系人
export function deleteDemo01Contact(id: number) {
  return defHttp.delete({ url: `/infra/demo01-contact/delete?id=${id}` })
}

// 导出示例联系人 Excel
export function exportDemo01Contact(params) {
  return defHttp.download({ url: '/infra/demo01-contact/export-excel', params }, '示例联系人.xls')
}

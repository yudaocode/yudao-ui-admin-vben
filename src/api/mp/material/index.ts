import { defHttp } from '@/utils/http/axios'

// 获得公众号素材分页
export function getMaterialPage(params) {
  return defHttp.get({ url: '/mp/material/page', params })
}

// 删除公众号永久素材
export function deletePermanentMaterial(id) {
  return defHttp.delete({ url: `/mp/material/delete-permanent?id=${id}` })
}

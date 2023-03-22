import { defHttp } from '@/utils/http/axios'

// 获得公众号素材分页
export const getFreePublishPage = (params) => {
  return defHttp.get({ url: '/mp/free-publish/page', params })
}

// 删除公众号素材
export const deleteFreePublish = (accountId, articleId) => {
  return defHttp.delete({ url: '/mp/free-publish/delete?accountId=' + accountId + '&&articleId=' + articleId })
}

// 发布公众号素材
export const submitFreePublish = (accountId, mediaId) => {
  return defHttp.post({ url: '/mp/free-publish/submit?accountId=' + accountId + '&&mediaId=' + mediaId })
}

import { defHttp } from '@/utils/http/axios'

// 获得公众号草稿分页
export const getDraftPage = (params) => {
  return defHttp.get({ url: '/mp/draft/page', params })
}

// 创建公众号草稿
export const createDraft = (accountId, articles) => {
  return defHttp.post({
    url: '/mp/draft/create?accountId=' + accountId,
    data: {
      articles
    }
  })
}

// 更新公众号草稿
export const updateDraft = (accountId, mediaId, articles) => {
  return defHttp.put({ url: '/mp/draft/update?accountId=' + accountId + '&mediaId=' + mediaId, data: articles })
}

// 删除公众号草稿
export const deleteDraft = (accountId, mediaId) => {
  return defHttp.delete({ url: '/mp/draft/delete?accountId=' + accountId + '&mediaId=' + mediaId })
}

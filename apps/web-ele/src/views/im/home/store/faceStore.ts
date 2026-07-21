import type { ImFacePackApi } from '#/api/im/face/pack'
import type { ImFaceUserItemApi } from '#/api/im/face/userItem'

import { ref } from 'vue'

import { acceptHMRUpdate, defineStore } from 'pinia'

import { getFacePackList as apiGetFacePackList } from '#/api/im/face/pack'
import {
  createFaceUserItem as apiCreateFaceUserItem,
  deleteFaceUserItem as apiDeleteFaceUserItem,
  getFaceUserItemList as apiGetFaceUserItemList
} from '#/api/im/face/userItem'

import {
  ResourceRequestKey,
  ResourceRequestMode,
  runResourceRequest
} from '../../utils/resourceRequest'

type ImFacePackUserVO = ImFacePackApi.FacePackUser
type ImFaceUserItemVO = ImFaceUserItemApi.FaceUserItem
type ImFaceUserItemSaveReqVO = ImFaceUserItemApi.FaceUserItemSaveReqVO

/**
 * IM 表情面板数据 store（系统表情包 + 个人表情）
 *
 * 不持久化：数据小、低频；每次进 IM 第一次打开表情面板时按需拉，关 tab 即丢弃
 * - 系统包：IM 主页 onMounted 后台预拉（不阻塞首屏），消除面板首次展开的白屏
 * - 个人表情：切到「收藏」tab / 长按消息「添加到表情」时按需拉
 */
export const useFaceStore = defineStore('imFace', () => {
  /** 系统表情包列表（含每个包的 items）；运营管理后台维护 */
  const facePacks = ref<ImFacePackUserVO[]>([])
  /** 个人表情包列表（用户长按「添加到表情」/ 上传产生） */
  const faceUserItems = ref<ImFaceUserItemVO[]>([])

  /** 按需拉取系统表情包（已拉过则直接复用 cached promise） */
  async function ensureFacePackList(): Promise<void> {
    await runResourceRequest(
      ResourceRequestKey.FACE_PACKS,
      async () => {
        const data = await apiGetFacePackList()
        facePacks.value = data || []
      },
      { mode: ResourceRequestMode.CACHE_SUCCESS }
    )
  }

  /** 按需拉取个人表情（已拉过则直接复用 cached promise） */
  async function ensureFaceUserItemList(): Promise<void> {
    await runResourceRequest(
      ResourceRequestKey.FACE_USER_ITEMS,
      async () => {
        const data = await apiGetFaceUserItemList()
        faceUserItems.value = data || []
      },
      { mode: ResourceRequestMode.CACHE_SUCCESS }
    )
  }

  /**
   * 添加个人表情；服务端对同 URL 抛 FACE_USER_ITEM_DUPLICATED 错误
   *
   * 来源：1. 用户在表情面板「+」上传图片  2. 长按消息「添加到表情」
   */
  async function addFaceUserItem(reqVO: ImFaceUserItemSaveReqVO): Promise<boolean> {
    await ensureFaceUserItemList().catch((error) => {
      console.warn('[IM] 个人表情列表初始化失败，继续添加', error)
    })
    const id = await apiCreateFaceUserItem(reqVO)
    if (!id) {
      return false
    }
    if (!faceUserItems.value.some((item) => item.id === id)) {
      faceUserItems.value.unshift({
        id,
        url: reqVO.url,
        name: reqVO.name,
        width: reqVO.width,
        height: reqVO.height
      })
    }
    return true
  }

  /** 删除个人表情；本地立即移除 */
  async function removeFaceUserItem(id: number): Promise<boolean> {
    await ensureFaceUserItemList().catch((error) => {
      console.warn('[IM] 个人表情列表初始化失败，继续删除', error)
    })
    try {
      await apiDeleteFaceUserItem(id)
      faceUserItems.value = faceUserItems.value.filter((item) => item.id !== id)
      return true
    } catch (e) {
      console.warn('[IM] 删除个人表情失败', { id }, e)
      return false
    }
  }

  /** 清空表情缓存 */
  function clear(): void {
    facePacks.value = []
    faceUserItems.value = []
  }

  return {
    facePacks,
    faceUserItems,
    ensureFacePackList,
    ensureFaceUserItemList,
    addFaceUserItem,
    removeFaceUserItem,
    clear
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFaceStore, import.meta.hot))
}

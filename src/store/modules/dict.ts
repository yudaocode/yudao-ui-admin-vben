import { defineStore } from 'pinia'
import type { DictState } from '@/types/store'

import { store } from '@/store'

import { DICT_KEY } from '@/enums/cacheEnum'
import { createLocalStorage } from '@/utils/cache'
import { listSimpleDictData } from '@/api/system/dict/data'
import type { DictDataVO } from '@/api/system/dict/types'

const ls = createLocalStorage()

export const useDictStore = defineStore({
  id: 'app-dict',
  state: (): DictState => ({
    dictMap: new Map<string, any>(),
    isSetDict: false,
  }),
  getters: {
    getDictMap(state): Recordable {
      const dictMap = ls.get(DICT_KEY)
      if (dictMap)
        state.dictMap = dictMap

      return state.dictMap
    },
    getIsSetDict(state): boolean {
      return state.isSetDict
    },
  },
  actions: {
    async setDictMap() {
      const dictMap = ls.get(DICT_KEY)
      if (dictMap) {
        this.dictMap = dictMap
        this.isSetDict = true
      }
      else {
        const res = await listSimpleDictData()
        // 设置数据
        const dictDataMap = new Map<string, any>()
        res.forEach((dictData: DictDataVO) => {
          // 获得 dictType 层级
          const enumValueObj = dictDataMap[dictData.dictType]
          if (!enumValueObj)
            dictDataMap[dictData.dictType] = []

          // 处理 dictValue 层级
          dictDataMap[dictData.dictType].push({
            value: dictData.value,
            label: dictData.label,
            colorType: dictData.colorType,
            cssClass: dictData.cssClass,
          })
        })
        this.dictMap = dictDataMap
        this.isSetDict = true
        ls.set(DICT_KEY, dictDataMap, 60) // 60 秒 过期
      }
    },
  },
})

// Need to be used outside the setup
export function useDictStoreWithOut() {
  return useDictStore(store)
}

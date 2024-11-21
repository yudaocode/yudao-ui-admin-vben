import { StorageManager } from '@vben/utils';

import { acceptHMRUpdate, defineStore } from 'pinia';

import { getSimpleDictDataList } from '#/api/system/dict/dict.data';

const DICT_STORAGE_KEY = 'DICT_STORAGE__';

interface DictValueType {
  value: any;
  label: string;
  colorType?: string;
  cssClass?: string;
}

// interface DictTypeType {
//   dictType: string;
//   dictValue: DictValueType[];
// }

interface DictState {
  dictMap: Map<string, DictValueType[]>;
  isSetDict: boolean;
}

const storage = new StorageManager({
  prefix: import.meta.env.VITE_APP_NAMESPACE,
  storageType: 'sessionStorage',
});

export const useDictStore = defineStore('dict', {
  actions: {
    async setDictMap() {
      try {
        const dataRes = await getSimpleDictDataList();

        const dictDataMap = new Map<string, DictValueType[]>();

        dataRes.forEach((item: any) => {
          let dictTypeArray = dictDataMap.get(item.dictType);
          if (!dictTypeArray) {
            dictTypeArray = [];
          }
          dictTypeArray.push({
            value: item.value,
            label: item.label,
            colorType: item.colorType,
            cssClass: item.cssClass,
          });
          dictDataMap.set(item.dictType, dictTypeArray);
        });

        this.dictMap = dictDataMap;
        this.isSetDict = true;

        // 将字典数据存储到 sessionStorage 中
        storage.setItem(DICT_STORAGE_KEY, dictDataMap, 60);
      } catch (error) {
        console.error('Failed to set dictionary values:', error);
      }
    },
  },
  getters: {
    getDictMap: (state) => state.dictMap,
    getDictData: (state) => (dictType: string) => {
      return state.dictMap.get(dictType);
    },
    getDictOptions: (state) => (dictType: string) => {
      return state.dictMap.get(dictType);
    },
  },
  persist: [{ pick: ['dictMap', 'isSetDict'] }],
  state: (): DictState => ({
    dictMap: new Map<string, DictValueType[]>(),
    isSetDict: false,
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useDictStore, hot));
}

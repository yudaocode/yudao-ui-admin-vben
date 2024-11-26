import type { DefaultOptionType } from 'ant-design-vue/es/select';

import { useDictStore } from '@vben/stores';
import { isObject } from '@vben/utils';

const dictStore = useDictStore();

/**
 * 获取字典对象
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典对象
 */
function getDictObj(dictType: string, value: any) {
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj : null;
}

/**
 * 获取字典数组 用于select radio 等
 * @param dictType 字典类型
 * @returns 字典数组
 */
function getDictOptions(
  dictType: string,
  valueType: 'boolean' | 'number' | 'string' = 'string',
) {
  const dictOpts = dictStore.getDictOptions(dictType);
  const dictOptions: DefaultOptionType = [];
  if (dictOpts.length > 0) {
    let dictValue: boolean | number | string = '';
    dictOpts.forEach((d) => {
      switch (valueType) {
        case 'boolean': {
          dictValue = `${d.value}` === 'true';
          break;
        }
        case 'number': {
          dictValue = Number.parseInt(`${d.value}`);
          break;
        }
        case 'string': {
          dictValue = `${d.value}`;
          break;
        }
        // No default
      }
      dictOptions.push({
        value: dictValue,
        label: d.label,
      });
    });
  }
  return dictOptions.length > 0 ? dictOptions : [];
}
export { getDictObj, getDictOptions };

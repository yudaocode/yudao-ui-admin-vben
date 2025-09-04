// TODO @芋艿：后续再优化
// TODO @芋艿：可以共享么？

import { isObject } from '@vben/utils';

import { useDictStore } from '#/store';

// TODO @dhb52：top-level 调用 导致："getActivePinia()" was called but there was no active Pinia
// 先临时移入到方法中
// const dictStore = useDictStore();

// TODO @dhb: antd 组件的 color 类型
type ColorType = 'error' | 'info' | 'success' | 'warning';

export interface DictDataType {
  dictType?: string;
  label: string;
  value: boolean | number | string;
  colorType?: ColorType;
  cssClass?: string;
}

export interface NumberDictDataType extends DictDataType {
  value: number;
}

export interface StringDictDataType extends DictDataType {
  value: string;
}

/**
 * 获取字典标签
 *
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典标签
 */
function getDictLabel(dictType: string, value: any) {
  const dictStore = useDictStore();
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj.label : '';
}

/**
 * 获取字典对象
 *
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典对象
 */
function getDictObj(dictType: string, value: any) {
  const dictStore = useDictStore();
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj : null;
}

/**
 * 获取字典数组 用于select radio 等
 *
 * @param dictType 字典类型
 * @param valueType 字典值类型，默认 string 类型
 * @returns 字典数组
 */
function getDictOptions(
  dictType: string,
  valueType: 'boolean' | 'number' | 'string' = 'string',
): DictDataType[] {
  const dictStore = useDictStore();
  const dictOpts = dictStore.getDictOptions(dictType);
  const dictOptions: DictDataType[] = [];
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

// TODO @dhb52：下面的一系列方法，看看能不能复用 getDictOptions 方法
export const getIntDictOptions = (dictType: string): NumberDictDataType[] => {
  // 获得通用的 DictDataType 列表
  const dictOptions = getDictOptions(dictType) as DictDataType[];
  // 转换成 number 类型的 NumberDictDataType 类型
  // why 需要特殊转换：避免 IDEA 在 v-for="dict in getIntDictOptions(...)" 时，el-option 的 key 会告警
  const dictOption: NumberDictDataType[] = [];
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: Number.parseInt(`${dict.value}`),
    });
  });
  return dictOption;
};

// TODO @dhb52：下面的一系列方法，看看能不能复用 getDictOptions 方法
export const getStrDictOptions = (dictType: string) => {
  // 获得通用的 DictDataType 列表
  const dictOptions = getDictOptions(dictType) as DictDataType[];
  // 转换成 string 类型的 StringDictDataType 类型
  // why 需要特殊转换：避免 IDEA 在 v-for="dict in getStrDictOptions(...)" 时，el-option 的 key 会告警
  const dictOption: StringDictDataType[] = [];
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: `${dict.value}`,
    });
  });
  return dictOption;
};

// TODO @dhb52：下面的一系列方法，看看能不能复用 getDictOptions 方法
export const getBoolDictOptions = (dictType: string) => {
  const dictOption: DictDataType[] = [];
  const dictOptions = getDictOptions(dictType) as DictDataType[];
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: `${dict.value}` === 'true',
    });
  });
  return dictOption;
};

export { getDictLabel, getDictObj, getDictOptions };

export { DICT_TYPE } from '@vben/constants';

// TODO @芋艿：后续再优化
// TODO @芋艿：可以共享么？

import type { DictItem } from '#/store';

import { isObject } from '@vben/utils';

import { useDictStore } from '#/store';

// TODO @dhb52：top-level 调用 导致："getActivePinia()" was called but there was no active Pinia
// 先临时移入到方法中
// const dictStore = useDictStore();

/** AntD 组件的颜色类型 */
type ColorType = 'error' | 'info' | 'success' | 'warning';

/** 字典值类型 */
type DictValueType = 'boolean' | 'number' | 'string';

/** 基础字典数据类型 */
export interface DictDataType {
  dictType?: string;
  label: string;
  value: boolean | number | string;
  colorType?: string;
  cssClass?: string;
}

/** 数字类型字典数据 */
export interface NumberDictDataType extends DictDataType {
  value: number;
}

/** 字符串类型字典数据 */
export interface StringDictDataType extends DictDataType {
  value: string;
}

/** 布尔类型字典数据 */
export interface BooleanDictDataType extends DictDataType {
  value: boolean;
}

/** 字典缓存管理器 */
class DictCacheManager {
  private cache = new Map<string, DictDataType[]>();
  private maxCacheSize = 100; // 最大缓存数量

  /** 清空缓存 */
  clear(): void {
    this.cache.clear();
  }

  /** 删除指定字典类型的缓存 */
  delete(dictType: string): void {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${dictType}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /** 获取缓存数据 */
  get(dictType: string, valueType: DictValueType): DictDataType[] | undefined {
    return this.cache.get(this.getCacheKey(dictType, valueType));
  }

  /** 设置缓存数据 */
  set(dictType: string, valueType: DictValueType, data: DictDataType[]): void {
    const key = this.getCacheKey(dictType, valueType);

    // 如果缓存数量超过限制，删除最早的缓存
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, data);
  }

  /** 获取缓存键 */
  private getCacheKey(dictType: string, valueType: DictValueType): string {
    return `${dictType}:${valueType}`;
  }
}

/** 字典缓存实例 */
const dictCache = new DictCacheManager();

/** 值转换器映射 */
const valueConverters: Record<
  DictValueType,
  (value: any) => boolean | number | string
> = {
  boolean: (value: any) => `${value}` === 'true',
  number: (value: any) => Number.parseInt(`${value}`, 10),
  string: (value: any) => `${value}`,
};

/**
 * 获取字典标签
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典标签
 */
function getDictLabel(dictType: string, value: any): string {
  const dictStore = useDictStore();
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj.label : '';
}

/**
 * 获取字典对象
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典对象
 */
function getDictObj(dictType: string, value: any): DictItem | null {
  const dictStore = useDictStore();
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj : null;
}

/**
 * 获取字典数组 - 优化版本，支持缓存和泛型
 * @param dictType 字典类型
 * @param valueType 字典值类型，默认 string 类型
 * @returns 字典数组
 */
function getDictOptions<T extends DictValueType = 'string'>(
  dictType: string,
  valueType: T = 'string' as T,
): T extends 'number'
  ? NumberDictDataType[]
  : T extends 'boolean'
    ? BooleanDictDataType[]
    : StringDictDataType[] {
  // 检查缓存
  const cachedData = dictCache.get(dictType, valueType);
  if (cachedData) {
    return cachedData as any;
  }

  const dictStore = useDictStore();
  const dictOpts = dictStore.getDictOptions(dictType);

  if (dictOpts.length === 0) {
    return [] as any;
  }

  const converter = valueConverters[valueType];
  const dictOptions: DictDataType[] = dictOpts.map((d: DictItem) => ({
    value: converter(d.value),
    label: d.label,
    colorType: d.colorType,
    cssClass: d.cssClass,
  }));

  // 缓存结果
  dictCache.set(dictType, valueType, dictOptions);

  return dictOptions as any;
}

/**
 * 清空字典缓存
 */
export const clearDictCache = (): void => {
  dictCache.clear();
};

/**
 * 删除指定字典类型的缓存
 * @param dictType 字典类型
 */
export const deleteDictCache = (dictType: string): void => {
  dictCache.delete(dictType);
};

export {
  type ColorType,
  type DictValueType,
  getDictLabel,
  getDictObj,
  getDictOptions,
};

export { DICT_TYPE } from '@vben/constants';

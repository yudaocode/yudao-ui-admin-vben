import type { Recordable } from '@vben/types';

export * from './rangePickerProps';
export * from './routerHelper';

/**
 * 查找数组对象的某个下标
 * @param {Array} ary 查找的数组
 * @param {Function} fn 判断的方法
 */
type Fn<T = any> = (item: T, index: number, array: Array<T>) => boolean;

export const findIndex = <T = Recordable<any>>(
  ary: Array<T>,
  fn: Fn<T>,
): number => {
  if (ary.findIndex) {
    return ary.findIndex((item, index, array) => fn(item, index, array));
  }
  let index = -1;
  ary.some((item: T, i: number, ary: Array<T>) => {
    const ret: boolean = fn(item, i, ary);
    if (ret) {
      index = i;
      return true;
    }
    return false;
  });
  return index;
};

/**
 * URL 验证
 * @param path URL 路径
 */
export const isUrl = (path: string): boolean => {
  // fix:修复hash路由无法跳转的问题
  const reg =
    /(((^https?:(?:\/\/)?)(?:[-:&=+$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%#/.\w-]*)?\??[-+=&%@.\w]*(?:#\w*)?)?)$/;
  return reg.test(path);
};

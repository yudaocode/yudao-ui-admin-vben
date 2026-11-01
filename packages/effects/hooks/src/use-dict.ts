import type { DictItem } from '@vben/stores';

import { setDictHandler, useAccessStore, useDictStore } from '@vben/stores';

type ColorType = 'error' | 'info' | 'success' | 'warning';

/** 芋道 GET /system/dict-data/simple-list 返回的扁平字典数据 */
export interface SimpleDictData {
  colorType?: string;
  cssClass?: string;
  dictType: string;
  label: string;
  value: number | string;
}

/** 全量加载失败或为空后，同步读取触发后台重试的最小间隔 */
const DICT_RETRY_INTERVAL = 10_000;

let dictHandlerReady = false;
let inflightLoad: null | Promise<void> = null;
/** 最近一次加载结束（成功或失败）的时间，用于失败重试节流 */
let lastSettledAt = 0;
/** 最近一次成功加载到非空字典的时间，用于避免登录后守卫重复刷新 */
let lastLoadedAt = 0;
/** 最近一次加载是否失败 */
let lastLoadFailed = false;

/**
 * 将扁平字典数据按 dictType 分组，作为官方字典 store 的全量数据
 *
 * @param list simple-list 返回的字典数据
 */
export function groupDictData(
  list: null | SimpleDictData[] | undefined,
): Record<string, DictItem[]> {
  const dictMap: Record<string, DictItem[]> = {};
  for (const item of list ?? []) {
    (dictMap[item.dictType] ??= []).push({
      colorType: item.colorType,
      cssClass: item.cssClass,
      label: item.label,
      value: item.value,
    });
  }
  return dictMap;
}

/**
 * 注册芋道字典处理器：只提供 getAllDicts，复用官方 store 的缓存
 *
 * @param api 获取全部字典数据的接口（无需管理员权限的 simple-list）
 */
export function setupDictHandler(api: () => Promise<SimpleDictData[]>) {
  setDictHandler({
    async getAllDicts() {
      return groupDictData(await api());
    },
  });
  dictHandlerReady = true;
}

/**
 * 强制全量加载；失败只记录日志，不向调用方抛出
 * 未登录（如登出后晚到的回调）时不发请求，避免匿名请求触发 401 重新认证
 */
function startDictLoad(): Promise<void> {
  if (!useAccessStore().accessToken) {
    return Promise.resolve();
  }
  const task: Promise<void> = useDictStore()
    .loadAllDicts(true)
    .then(() => {
      if (inflightLoad === task) {
        lastLoadFailed = false;
        if (hasDictCache()) {
          lastLoadedAt = Date.now();
        }
      }
    })
    .catch((error) => {
      if (inflightLoad === task) {
        lastLoadFailed = true;
      }
      console.error('[dict] Failed to load dictionaries:', error);
    })
    .finally(() => {
      lastSettledAt = Date.now();
      if (inflightLoad === task) {
        inflightLoad = null;
      }
    });
  inflightLoad = task;
  return task;
}

function hasDictCache() {
  return Object.keys(useDictStore().dictMap).length > 0;
}

/**
 * 首次进入应用时预加载字典
 * - 无缓存：等待加载完成，保证页面初始化 schema 同步取得 options
 * - 有持久化缓存：先使用缓存，后台强制刷新（官方无 getVersion 时不会自动刷新）
 * - 加载失败不阻塞路由，之后同步读取时按间隔后台重试
 */
export async function preloadDicts(): Promise<void> {
  if (!dictHandlerReady) {
    return;
  }
  if (hasDictCache()) {
    // 有缓存不阻塞；刚刚加载过（例如登录成功时）不重复请求
    if (!inflightLoad && Date.now() - lastLoadedAt >= DICT_RETRY_INTERVAL) {
      startDictLoad();
    }
    return;
  }
  // 无缓存：发起或复用进行中的加载并等待。
  // 等待中的请求可能被 refreshDict()/$reset 废弃（如切换租户），此时继续等待更新的请求；
  // 加载失败时直接放行，之后由同步读取按间隔重试
  if (!inflightLoad) {
    startDictLoad();
  }
  while (inflightLoad && !hasDictCache()) {
    await inflightLoad;
  }
  // 等到的请求成功但结果被 $reset 废弃（如登出后扫码登录），缓存仍为空：重新加载一次
  // 若此时已登出，startDictLoad 不会发请求
  if (!hasDictCache() && !lastLoadFailed) {
    await startDictLoad();
  }
}

export interface RefreshDictsOptions {
  /**
   * 是否在重新加载期间保留当前缓存
   * - false（默认）：登录、租户切换等上下文变化，立即清空缓存
   * - true：同一身份/租户下的字典增删改，加载期间继续提供旧的有效选项；
   *   加载失败时也保留当前缓存
   */
  preserveCache?: boolean;
}

/**
 * 刷新字典：先用官方 refreshDict() 废弃旧请求，再强制加载；失败不抛出
 *
 * @param options 刷新选项
 */
export async function refreshDicts(
  options: RefreshDictsOptions = {},
): Promise<void> {
  if (!dictHandlerReady) {
    return;
  }
  const dictStore = useDictStore();
  // 同步取当前缓存，并在 refreshDict() 后同步恢复：仍废弃旧请求（批次号递增），
  // 但不会在 await 之后回写，避免跨上下文覆盖
  const snapshot = options.preserveCache ? dictStore.dictMap : undefined;
  dictStore.refreshDict();
  if (snapshot) {
    dictStore.dictMap = snapshot;
  }
  let current = startDictLoad();
  await current;
  // 本次加载结束前可能被更新的刷新废弃（结果被丢弃），此时 inflightLoad 是替代它的加载：
  // 缓存仍为空时继续等待，避免调用方（如租户切换后 refreshTab）在缓存为空时重建 schema。
  // 只等待已发起的请求，不额外发起加载；替代加载结束（含空结果、失败）即放行
  while (!hasDictCache() && inflightLoad && inflightLoad !== current) {
    current = inflightLoad;
    await current;
  }
}

/** 同步读取时缓存仍为空（首次加载失败等），按间隔后台重试 */
function ensureDictsLoaded() {
  if (!dictHandlerReady || inflightLoad || hasDictCache()) {
    return;
  }
  if (Date.now() - lastSettledAt < DICT_RETRY_INTERVAL) {
    return;
  }
  // 未登录时 startDictLoad 不发请求
  startDictLoad();
}

function getDictItems(dictType: string): DictItem[] {
  ensureDictsLoaded();
  return useDictStore().dictMap[dictType] ?? [];
}

function findDictItem(dictType: string, value: any): DictItem | undefined {
  // 值为空时直接返回，避免空值调用 toString 报错
  if (value === undefined || value === null) {
    return undefined;
  }
  return getDictItems(dictType).find(
    (item) => String(item.value) === String(value),
  );
}

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
export function getDictLabel(dictType: string, value: any): string {
  return findDictItem(dictType, value)?.label ?? '';
}

/**
 * 获取字典对象
 *
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典对象
 */
export function getDictObj(dictType: string, value: any): DictItem | null {
  return findDictItem(dictType, value) ?? null;
}

/**
 * 获取字典数组 用于select radio 等
 *
 * @param dictType 字典类型
 * @param valueType 字典值类型，默认 string 类型
 * @returns 字典数组
 */
export function getDictOptions(
  dictType: string,
  valueType: 'boolean',
): Array<DictDataType & { value: boolean }>;
export function getDictOptions(
  dictType: string,
  valueType: 'number',
): NumberDictDataType[];
export function getDictOptions(
  dictType: string,
  valueType?: 'string',
): StringDictDataType[];
export function getDictOptions(
  dictType: string,
  valueType: 'boolean' | 'number' | 'string',
): DictDataType[];
export function getDictOptions(
  dictType: string,
  valueType: 'boolean' | 'number' | 'string' = 'string',
): DictDataType[] {
  const dictOpts = getDictItems(dictType);
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

import type { SimpleDictData } from '../use-dict';

import { afterEach, describe, expect, it, vi } from 'vitest';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const GENDER: SimpleDictData[] = [
  {
    colorType: 'primary',
    cssClass: 'gender-male',
    dictType: 'system_user_sex',
    label: '男',
    value: '1',
  },
  {
    colorType: 'danger',
    cssClass: '',
    dictType: 'system_user_sex',
    label: '女',
    value: '2',
  },
  { dictType: 'infra_boolean_string', label: '是', value: 'true' },
  { dictType: 'infra_boolean_string', label: '否', value: 'false' },
];

/**
 * use-dict.ts 有模块级加载状态，每个用例重新加载模块与 Pinia
 */
async function setup(options: { token?: null | string } = {}) {
  vi.resetModules();
  const { createPinia, setActivePinia } = await import('pinia');
  setActivePinia(createPinia());
  const stores = await import('@vben/stores');
  const dict = await import('../use-dict');
  stores.useAccessStore().setAccessToken(options.token ?? 'token');
  return { dict, stores };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('use-dict compatibility layer', () => {
  it('groups simple-list data by dictType and keeps colorType/cssClass', async () => {
    const { dict } = await setup();
    expect(dict.groupDictData(GENDER).system_user_sex).toEqual([
      {
        colorType: 'primary',
        cssClass: 'gender-male',
        label: '男',
        value: '1',
      },
      { colorType: 'danger', cssClass: '', label: '女', value: '2' },
    ]);
    expect(dict.groupDictData(null)).toEqual({});
  });

  it('keeps the legacy value conversion, empty label and null object behavior', async () => {
    const { dict } = await setup();
    dict.setupDictHandler(async () => GENDER);
    await dict.preloadDicts();

    expect(dict.getDictOptions('system_user_sex', 'number')).toEqual([
      { label: '男', value: 1 },
      { label: '女', value: 2 },
    ]);
    expect(dict.getDictOptions('system_user_sex')).toEqual([
      { label: '男', value: '1' },
      { label: '女', value: '2' },
    ]);
    expect(dict.getDictOptions('infra_boolean_string', 'boolean')).toEqual([
      { label: '是', value: true },
      { label: '否', value: false },
    ]);
    expect(dict.getDictOptions('unknown_type')).toEqual([]);

    // 数字、字符串、布尔值都能匹配字符串存储的字典值
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('男');
    expect(dict.getDictLabel('system_user_sex', '2')).toBe('女');
    expect(dict.getDictLabel('infra_boolean_string', true)).toBe('是');
    expect(dict.getDictLabel('system_user_sex', 9)).toBe('');
    expect(dict.getDictLabel('system_user_sex', null)).toBe('');
    expect(dict.getDictLabel('system_user_sex', undefined)).toBe('');

    expect(dict.getDictObj('system_user_sex', 1)).toMatchObject({
      colorType: 'primary',
      cssClass: 'gender-male',
      label: '男',
    });
    expect(dict.getDictObj('system_user_sex', 9)).toBeNull();
    expect(dict.getDictObj('system_user_sex', null)).toBeNull();
  });

  it('waits for the first load when there is no cache', async () => {
    const { dict } = await setup();
    const request = deferred<SimpleDictData[]>();
    const api = vi.fn(() => request.promise);
    dict.setupDictHandler(api);

    let settled = false;
    const preload = dict.preloadDicts().then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false);

    request.resolve(GENDER);
    await preload;
    expect(api).toHaveBeenCalledTimes(1);
    // 路由放行后，页面 schema 同步读取即可拿到 options
    expect(dict.getDictOptions('system_user_sex')).toHaveLength(2);
  });

  it('uses the cache without blocking and refreshes it in the background', async () => {
    const { dict, stores } = await setup();
    stores.useDictStore().dictMap = {
      system_user_sex: [{ label: '旧', value: '1' }],
    };
    const request = deferred<SimpleDictData[]>();
    const api = vi.fn(() => request.promise);
    dict.setupDictHandler(api);

    await dict.preloadDicts();
    expect(api).toHaveBeenCalledTimes(1);
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('旧');

    request.resolve(GENDER);
    await flush();
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('男');
  });

  it('does not refetch in the guard right after the login refresh', async () => {
    const { dict } = await setup();
    const api = vi.fn(async () => GENDER);
    dict.setupDictHandler(api);

    await dict.refreshDicts();
    await dict.preloadDicts();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('discards a stale response that settles after a context refresh', async () => {
    const { dict } = await setup();
    const oldRequest = deferred<SimpleDictData[]>();
    const newRequest = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    dict.setupDictHandler(api);

    // 守卫首次加载进行中，切换租户触发刷新
    const preload = dict.preloadDicts();
    const refresh = dict.refreshDicts();
    expect(api).toHaveBeenCalledTimes(2);

    // 旧请求先返回：不能写入缓存，守卫的预加载继续等待新请求
    oldRequest.resolve([
      { dictType: 'system_user_sex', label: '旧租户', value: '1' },
    ]);
    let preloaded = false;
    void preload.then(() => {
      preloaded = true;
    });
    await flush();
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);
    expect(preloaded).toBe(false);

    newRequest.resolve(GENDER);
    await Promise.all([preload, refresh]);
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('男');
  });

  it('keeps an older response from overwriting a newer refresh', async () => {
    const { dict } = await setup();
    const first = deferred<SimpleDictData[]>();
    const second = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    dict.setupDictHandler(api);

    const a = dict.refreshDicts();
    const b = dict.refreshDicts();
    second.resolve(GENDER);
    await b;
    first.resolve([{ dictType: 'system_user_sex', label: '旧', value: '1' }]);
    await a;
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('男');
  });

  it('does not reject on failure and retries on a later read after the interval', async () => {
    const { dict } = await setup();
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(GENDER);
    dict.setupDictHandler(api);

    // 预加载与 CRUD 后刷新都不向调用方抛错
    await expect(dict.preloadDicts()).resolves.toBeUndefined();
    expect(api).toHaveBeenCalledTimes(1);

    // 间隔内同步读取不重复请求
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);
    expect(api).toHaveBeenCalledTimes(1);

    // 超过间隔后再次读取触发后台重试
    now += 10_000;
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);
    expect(api).toHaveBeenCalledTimes(2);
    await flush();
    expect(dict.getDictOptions('system_user_sex')).toHaveLength(2);
  });

  it('resolves refreshDicts even when the reload fails', async () => {
    const { dict } = await setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    dict.setupDictHandler(async () => {
      throw new Error('500');
    });
    await expect(dict.refreshDicts()).resolves.toBeUndefined();
  });

  it('reloads once when the awaited load was discarded by $reset', async () => {
    const { dict, stores } = await setup();
    const stale = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(GENDER);
    dict.setupDictHandler(api);

    // 旧会话的加载进行中，登出 resetAllStores() 触发官方 $reset
    void dict.refreshDicts();
    stores.useDictStore().$reset();

    // 新会话守卫预加载：复用旧请求，旧结果被丢弃后再加载一次
    const preload = dict.preloadDicts();
    stale.resolve([{ dictType: 'system_user_sex', label: '旧', value: '1' }]);
    await preload;
    expect(api).toHaveBeenCalledTimes(2);
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('男');
  });

  it('does not retry while logged out', async () => {
    const { dict, stores } = await setup();
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const api = vi.fn(async () => GENDER);
    dict.setupDictHandler(api);
    stores.useAccessStore().setAccessToken(null);

    now += 60_000;
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);
    expect(api).not.toHaveBeenCalled();
  });

  it('does not reload after logout when the awaited load was discarded', async () => {
    const { dict, stores } = await setup();
    const request = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockReturnValueOnce(request.promise)
      .mockResolvedValue(GENDER);
    dict.setupDictHandler(api);

    // 守卫预加载进行中，用户登出：清空 token 并 resetAllStores() 触发官方 $reset
    const preload = dict.preloadDicts();
    stores.useAccessStore().setAccessToken(null);
    stores.useDictStore().$reset();

    request.resolve(GENDER);
    await preload;
    await flush();
    expect(api).toHaveBeenCalledTimes(1);
    expect(stores.useDictStore().dictMap).toEqual({});
  });

  it('ignores a late CRUD refresh after logout', async () => {
    const { dict, stores } = await setup();
    const api = vi.fn(async () => GENDER);
    dict.setupDictHandler(api);

    stores.useAccessStore().setAccessToken(null);
    stores.useDictStore().$reset();
    // 登出后才执行到的 Grid 成功回调
    await dict.refreshDicts({ preserveCache: true });
    await dict.refreshDicts();
    expect(api).not.toHaveBeenCalled();
    expect(stores.useDictStore().dictMap).toEqual({});
  });

  it('keeps the current options while a CRUD refresh is loading', async () => {
    const { dict } = await setup();
    const reload = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockResolvedValueOnce(GENDER)
      .mockReturnValueOnce(reload.promise);
    dict.setupDictHandler(api);
    await dict.preloadDicts();

    // Grid 成功回调后，destroyOnClose 重建的表单 setup 立即捕获 options
    const refresh = dict.refreshDicts({ preserveCache: true });
    const schemaOptions = dict.getDictOptions('system_user_sex', 'number');
    expect(schemaOptions).toEqual([
      { label: '男', value: 1 },
      { label: '女', value: 2 },
    ]);
    expect(api).toHaveBeenCalledTimes(2);

    reload.resolve([
      ...GENDER,
      { dictType: 'system_user_sex', label: '未知', value: '0' },
    ]);
    await refresh;
    // 已捕获的数组仍是有效选项，新读取拿到新数据
    expect(schemaOptions).toHaveLength(2);
    expect(dict.getDictOptions('system_user_sex', 'number')).toHaveLength(3);
    expect(dict.getDictLabel('system_user_sex', 0)).toBe('未知');
  });

  it('keeps the current cache when a CRUD refresh fails', async () => {
    const { dict } = await setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockResolvedValueOnce(GENDER)
      .mockRejectedValueOnce(new Error('500'));
    dict.setupDictHandler(api);
    await dict.preloadDicts();

    await expect(
      dict.refreshDicts({ preserveCache: true }),
    ).resolves.toBeUndefined();
    expect(api).toHaveBeenCalledTimes(2);
    expect(dict.getDictOptions('system_user_sex')).toHaveLength(2);
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('男');
  });

  it('clears on a context switch and drops the pending CRUD response', async () => {
    const { dict } = await setup();
    const crud = deferred<SimpleDictData[]>();
    const tenant = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockResolvedValueOnce(GENDER)
      .mockReturnValueOnce(crud.promise)
      .mockReturnValueOnce(tenant.promise);
    dict.setupDictHandler(api);
    await dict.preloadDicts();

    const crudRefresh = dict.refreshDicts({ preserveCache: true });
    expect(dict.getDictOptions('system_user_sex')).toHaveLength(2);

    // CRUD 刷新未返回时切换租户：默认模式立即清空
    const tenantRefresh = dict.refreshDicts();
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);
    expect(api).toHaveBeenCalledTimes(3);

    // 旧租户的 CRUD 响应晚到，不能写入新租户缓存
    crud.resolve([
      { dictType: 'system_user_sex', label: '旧租户', value: '1' },
    ]);
    await flush();
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);

    tenant.resolve([
      { dictType: 'system_user_sex', label: '新租户', value: '1' },
    ]);
    await Promise.all([crudRefresh, tenantRefresh]);
    expect(dict.getDictLabel('system_user_sex', 1)).toBe('新租户');
    expect(api).toHaveBeenCalledTimes(3);
  });

  it('keeps a cacheless context refresh waiting for the CRUD load that replaced it', async () => {
    const { dict } = await setup();
    const tenant = deferred<SimpleDictData[]>();
    const crud = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockReturnValueOnce(tenant.promise)
      .mockReturnValueOnce(crud.promise);
    dict.setupDictHandler(api);

    // 1. 租户切换：无缓存刷新 A
    let tenantSettled = false;
    const tenantRefresh = dict.refreshDicts().then(() => {
      tenantSettled = true;
    });
    // 2. CRUD 刷新 B 废弃 A，此时缓存仍为空
    const crudRefresh = dict.refreshDicts({ preserveCache: true });
    expect(api).toHaveBeenCalledTimes(2);
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);

    // 3. A 先返回：结果被丢弃，租户切换的等待者不能放行（否则 refreshTab 会捕获空选项）
    tenant.resolve([
      { dictType: 'system_user_sex', label: '旧批次', value: '1' },
    ]);
    await flush();
    expect(tenantSettled).toBe(false);
    expect(dict.getDictOptions('system_user_sex')).toEqual([]);

    // 4. B 返回后才放行：此时重建 schema 捕获的选项非空
    crud.resolve(GENDER);
    await tenantRefresh;
    const schemaOptions = dict.getDictOptions('system_user_sex', 'number');
    expect(schemaOptions).toEqual([
      { label: '男', value: 1 },
      { label: '女', value: 2 },
    ]);
    await crudRefresh;
    // 只等待已发起的请求，不额外加载
    expect(api).toHaveBeenCalledTimes(2);
  });

  it('releases the cacheless refresh waiter when the replacement load fails', async () => {
    const { dict } = await setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const tenant = deferred<SimpleDictData[]>();
    const crud = deferred<SimpleDictData[]>();
    const api = vi
      .fn<() => Promise<SimpleDictData[]>>()
      .mockReturnValueOnce(tenant.promise)
      .mockReturnValueOnce(crud.promise);
    dict.setupDictHandler(api);

    const tenantRefresh = dict.refreshDicts();
    const crudRefresh = dict.refreshDicts({ preserveCache: true });
    tenant.resolve(GENDER);
    crud.reject(new Error('500'));

    // 替代加载失败也放行，不抛错、不额外请求
    await expect(tenantRefresh).resolves.toBeUndefined();
    await expect(crudRefresh).resolves.toBeUndefined();
    expect(api).toHaveBeenCalledTimes(2);
  });
});

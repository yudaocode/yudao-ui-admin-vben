import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CALLBACK_NAME = '__BAIDU_MAP_LOAD_CALLBACK__';

let scripts: HTMLScriptElement[] = [];

async function importLoader() {
  const { loadBaiduMapSdk } = await import('../utils');
  return loadBaiduMapSdk;
}

function getCallback() {
  return (window as any)[CALLBACK_NAME];
}

beforeEach(() => {
  vi.resetModules();
  scripts = [];
  Reflect.deleteProperty(window, 'BMapGL');
  Reflect.deleteProperty(window, CALLBACK_NAME);
  vi.spyOn(document.body, 'append').mockImplementation((...nodes) => {
    scripts.push(nodes[0] as HTMLScriptElement);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'BMapGL');
  Reflect.deleteProperty(window, CALLBACK_NAME);
});

describe('loadBaiduMapSdk', () => {
  it('reuses an already loaded SDK', async () => {
    (window as any).BMapGL = {};
    const loadBaiduMapSdk = await importLoader();

    await loadBaiduMapSdk();
    expect(scripts).toHaveLength(0);
  });

  it('shares an in-flight load and cleans up on success', async () => {
    const loadBaiduMapSdk = await importLoader();
    const pending = loadBaiduMapSdk();

    expect(loadBaiduMapSdk()).toBe(pending);
    expect(scripts).toHaveLength(1);
    getCallback()();
    await pending;
    expect(getCallback()).toBeUndefined();
  });

  it('rejects script errors and allows a retry', async () => {
    const loadBaiduMapSdk = await importLoader();
    const first = loadBaiduMapSdk();

    scripts[0]?.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow('百度地图 SDK 加载失败');
    expect(getCallback()).toBeUndefined();

    const retry = loadBaiduMapSdk();
    expect(retry).not.toBe(first);
    expect(scripts).toHaveLength(2);
    getCallback()();
    await expect(retry).resolves.toBeUndefined();
    expect(getCallback()).toBeUndefined();
  });

  it('ignores errors from a timed-out script after retrying', async () => {
    vi.useFakeTimers();
    const loadBaiduMapSdk = await importLoader();
    const first = loadBaiduMapSdk(20);

    await Promise.all([
      expect(first).rejects.toThrow('百度地图 SDK 加载超时'),
      vi.advanceTimersByTimeAsync(20),
    ]);

    const retry = loadBaiduMapSdk(20);
    expect(retry).not.toBe(first);
    expect(scripts).toHaveLength(2);
    const retryCallback = getCallback();
    expect(retryCallback).toBeTypeOf('function');

    // 超时的旧 script 之后才报错，不能删除重试回调或打断在途加载
    scripts[0]?.dispatchEvent(new Event('error'));
    expect(getCallback()).toBe(retryCallback);
    expect(loadBaiduMapSdk(20)).toBe(retry);

    retryCallback();
    await expect(retry).resolves.toBeUndefined();
    expect(getCallback()).toBeUndefined();
  });
});

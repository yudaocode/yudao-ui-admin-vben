import type { App } from 'vue';

import { createApp, h, nextTick, reactive } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MapView from '../map-view.vue';

const PREVIEW_ERROR = 'baidu-map-preview-error';

vi.mock('../utils', () => ({
  BAIDU_MAP_PREVIEW_ERROR: 'baidu-map-preview-error',
  buildBaiduMapPreviewHtml: (longitude: number, latitude: number) =>
    `<p>${longitude},${latitude}</p>`,
}));

/** 模拟视口观察器，由测试控制可见状态 */
class FakeObserver {
  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    setVisible = (isIntersecting) => callback([{ isIntersecting }]);
  }

  disconnect() {}

  observe() {}
}

let setVisible: (visible: boolean) => void = () => {};
let app: App | undefined;
let host: HTMLElement | undefined;

/** 挂载地图预览并返回可修改的坐标 */
function mountMapView() {
  const point = reactive({ latitude: 39.915, longitude: 116.404 });
  host = document.createElement('div');
  document.body.append(host);
  app = createApp({ render: () => h(MapView, { ...point }) });
  app.mount(host);
  return point;
}

/** 获得当前预览 iframe */
function getFrame() {
  return host?.querySelector('iframe') ?? null;
}

/** 是否展示加载失败提示 */
function isFailed() {
  return host?.textContent?.includes('地图加载失败') ?? false;
}

/** 模拟收到 message 事件 */
function postPreviewError(source: null | Window) {
  window.dispatchEvent(
    new MessageEvent('message', { data: { type: PREVIEW_ERROR }, source }),
  );
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeObserver);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  host?.remove();
  host = undefined;
  vi.unstubAllGlobals();
});

describe('map view preview frame', () => {
  it('creates the preview frame only while visible', async () => {
    mountMapView();
    await nextTick();
    expect(getFrame()).toBeNull();

    setVisible(true);
    await nextTick();
    expect(getFrame()?.getAttribute('srcdoc')).toBe('<p>116.404,39.915</p>');

    setVisible(false);
    await nextTick();
    expect(getFrame()).toBeNull();
  });

  it('rebuilds the preview page when coordinates change', async () => {
    const point = mountMapView();
    setVisible(true);
    await nextTick();

    point.longitude = 121.4737;
    point.latitude = 31.2304;
    await nextTick();
    expect(getFrame()?.getAttribute('srcdoc')).toBe('<p>121.4737,31.2304</p>');
  });

  it('ignores queued failure from the replaced page', async () => {
    const point = mountMapView();
    setVisible(true);
    await nextTick();
    const oldFrame = getFrame();
    const oldWindow = oldFrame?.contentWindow;
    expect(oldWindow).toBeTruthy();

    point.longitude = 121.4737;
    point.latitude = 31.2304;
    await nextTick();
    const newFrame = getFrame();
    const newWindow = newFrame?.contentWindow;
    expect(newFrame).not.toBe(oldFrame);
    expect(newWindow).toBeTruthy();
    expect(newWindow).not.toBe(oldWindow);

    // 旧预览页面在坐标变化前已排队的失败消息，不能影响新的预览页面
    postPreviewError(oldWindow as Window);
    await nextTick();
    expect(isFailed()).toBe(false);

    postPreviewError(newWindow as Window);
    await nextTick();
    expect(isFailed()).toBe(true);
  });

  it('shows failure only for messages from the current frame', async () => {
    mountMapView();
    setVisible(true);
    await nextTick();
    const frameWindow = getFrame()?.contentWindow;
    expect(frameWindow).toBeTruthy();

    postPreviewError(window);
    await nextTick();
    expect(isFailed()).toBe(false);

    postPreviewError(frameWindow as Window);
    await nextTick();
    expect(isFailed()).toBe(true);

    // 重新进入视口会创建新的预览页面，清除上一次的失败状态
    setVisible(false);
    await nextTick();
    setVisible(true);
    await nextTick();
    expect(isFailed()).toBe(false);
  });
});

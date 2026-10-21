import type { App, Ref } from 'vue';

import type { ExtendedDrawerApi } from '../drawer';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { useVbenDrawer } from '../use-drawer';

vi.mock('@vben-core/preferences', () => ({
  usePreferences: () => ({
    globalEscapeShortcutKey: { value: true },
  }),
}));

vi.mock('../drawer.vue', () => ({
  default: {
    name: 'VbenDrawerStub',
    render: () => null,
  },
}));

let activeApp: App | undefined;

async function mountRebindingHarness() {
  const consumerKey = ref(0);
  let currentApi: ExtendedDrawerApi | undefined;
  const onOpenChange = vi.fn();

  const Consumer = defineComponent(() => {
    const [Drawer, drawerApi] = useVbenDrawer();
    currentApi = drawerApi;
    return () => h(Drawer);
  });

  const ConnectedDrawer = defineComponent(() => {
    return () => h(Consumer, { key: consumerKey.value });
  });

  const [ParentDrawer, parentApi] = useVbenDrawer({
    connectedComponent: ConnectedDrawer,
    onOpenChange,
    title: 'Parent drawer title',
  });
  const host = document.createElement('div');
  document.body.append(host);

  activeApp = createApp(() => h(ParentDrawer));
  activeApp.mount(host);
  await nextTick();

  return {
    consumerKey,
    getCurrentApi: () => currentApi,
    onOpenChange,
    parentApi,
  };
}

async function mountNestedHarness() {
  const consumerKey = ref(0);
  let currentApi: ExtendedDrawerApi | undefined;
  let nestedApi: ExtendedDrawerApi | undefined;
  const onConsumerConfirm = vi.fn();
  const onNestedConfirm = vi.fn();

  const NestedChild = defineComponent(() => {
    const [Drawer, drawerApi] = useVbenDrawer({ onConfirm: onNestedConfirm });
    nestedApi = drawerApi;
    return () => h(Drawer);
  });

  const Consumer = defineComponent(() => {
    const [Drawer, drawerApi] = useVbenDrawer({
      onConfirm: onConsumerConfirm,
    });
    currentApi = drawerApi;
    return () => [h(Drawer), h(NestedChild)];
  });

  const ConnectedDrawer = defineComponent(() => {
    return () => h(Consumer, { key: consumerKey.value });
  });

  const [ParentDrawer, parentApi] = useVbenDrawer({
    connectedComponent: ConnectedDrawer,
    title: 'Parent drawer title',
  });
  const host = document.createElement('div');
  document.body.append(host);

  activeApp = createApp(() => h(ParentDrawer));
  activeApp.mount(host);
  await nextTick();

  return {
    consumerKey,
    getCurrentApi: () => currentApi,
    getNestedApi: () => nestedApi,
    onConsumerConfirm,
    onNestedConfirm,
    parentApi,
  };
}

async function mountSameSetupHarness() {
  let mainApi: ExtendedDrawerApi | undefined;
  let innerApi: ExtendedDrawerApi | undefined;
  let setupCount = 0;
  const onMainConfirm = vi.fn();
  const onInnerConfirm = vi.fn();
  const onOpenChange = vi.fn();

  // 同一 setup 内，主抽屉须先于内部抽屉声明
  const Consumer = defineComponent(() => {
    setupCount += 1;
    const [Drawer, drawerApi] = useVbenDrawer({ onConfirm: onMainConfirm });
    const [InnerDrawer, innerDrawerApi] = useVbenDrawer({
      onConfirm: onInnerConfirm,
    });
    mainApi = drawerApi;
    innerApi = innerDrawerApi;
    return () => [h(Drawer), h(InnerDrawer)];
  });

  const [ParentDrawer, parentApi] = useVbenDrawer({
    connectedComponent: Consumer,
    destroyOnClose: true,
    onOpenChange,
    title: 'Parent drawer title',
  });
  const host = document.createElement('div');
  document.body.append(host);

  activeApp = createApp(() => h(ParentDrawer));
  activeApp.mount(host);
  await nextTick();

  return {
    getInnerApi: () => innerApi,
    getMainApi: () => mainApi,
    getSetupCount: () => setupCount,
    onInnerConfirm,
    onMainConfirm,
    onOpenChange,
    parentApi,
  };
}

async function remountConsumer(consumerKey: Ref<number>) {
  consumerKey.value += 1;
  await nextTick();
}

afterEach(() => {
  activeApp?.unmount();
  activeApp = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('useVbenDrawer', () => {
  it('rebinds the parent api when the consumer is recreated', async () => {
    const { consumerKey, getCurrentApi, onOpenChange, parentApi } =
      await mountRebindingHarness();
    const initialApi = getCurrentApi();

    expect(initialApi).toBeDefined();
    if (!initialApi) return;
    expect(parentApi.store).toBe(initialApi.store);
    const initialData = { id: 1 };
    parentApi.setData(initialData);
    expect(initialApi.getData()).toBe(initialData);

    await remountConsumer(consumerKey);
    const recreatedApi = getCurrentApi();

    expect(recreatedApi).toBeDefined();
    if (!recreatedApi) return;
    expect(recreatedApi).not.toBe(initialApi);
    expect(recreatedApi.store.state.title).toBe('Parent drawer title');
    expect(parentApi.store).toBe(recreatedApi.store);
    const recreatedData = { id: 2 };
    parentApi.setData(recreatedData);
    expect(recreatedApi.getData()).toBe(recreatedData);

    parentApi.open();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(recreatedApi.store.state.isOpen).toBe(true);
    expect(initialApi.store.state.isOpen).toBe(false);

    await parentApi.close();
    expect(recreatedApi.store.state.isOpen).toBe(false);
  });

  it('keeps nested drawers from rebinding the parent api', async () => {
    const {
      consumerKey,
      getCurrentApi,
      getNestedApi,
      onConsumerConfirm,
      onNestedConfirm,
      parentApi,
    } = await mountNestedHarness();
    const consumerApi = getCurrentApi();
    const nestedApi = getNestedApi();

    expect(consumerApi).toBeDefined();
    expect(nestedApi).toBeDefined();
    if (!consumerApi || !nestedApi) return;
    expect(parentApi.store).toBe(consumerApi.store);
    expect(parentApi.store).not.toBe(nestedApi.store);

    const data = { id: 1 };
    parentApi.setData(data);
    expect(consumerApi.getData()).toBe(data);
    expect(nestedApi.getData()).toBeUndefined();

    parentApi.open();
    expect(consumerApi.store.state.isOpen).toBe(true);
    expect(nestedApi.store.state.isOpen).toBe(false);

    nestedApi.open();
    expect(nestedApi.store.state.isOpen).toBe(true);
    nestedApi.onConfirm();
    expect(onNestedConfirm).toHaveBeenCalledTimes(1);
    expect(onConsumerConfirm).not.toHaveBeenCalled();
    await nestedApi.close();
    expect(nestedApi.store.state.isOpen).toBe(false);
    expect(consumerApi.store.state.isOpen).toBe(true);

    parentApi.onConfirm();
    expect(onConsumerConfirm).toHaveBeenCalledTimes(1);
    expect(onNestedConfirm).toHaveBeenCalledTimes(1);

    await parentApi.close();
    expect(consumerApi.store.state.isOpen).toBe(false);

    await remountConsumer(consumerKey);
    const recreatedApi = getCurrentApi();
    const recreatedNestedApi = getNestedApi();

    expect(recreatedApi).toBeDefined();
    expect(recreatedNestedApi).toBeDefined();
    if (!recreatedApi || !recreatedNestedApi) return;
    expect(recreatedApi).not.toBe(consumerApi);
    expect(recreatedNestedApi).not.toBe(nestedApi);
    expect(recreatedApi.store.state.title).toBe('Parent drawer title');
    expect(parentApi.store).toBe(recreatedApi.store);
    expect(parentApi.store).not.toBe(recreatedNestedApi.store);

    const recreatedData = { id: 2 };
    parentApi.setData(recreatedData);
    expect(recreatedApi.getData()).toBe(recreatedData);
    expect(recreatedNestedApi.getData()).toBeUndefined();

    parentApi.open();
    expect(recreatedApi.store.state.isOpen).toBe(true);
    expect(recreatedNestedApi.store.state.isOpen).toBe(false);

    parentApi.onConfirm();
    expect(onConsumerConfirm).toHaveBeenCalledTimes(2);
    expect(onNestedConfirm).toHaveBeenCalledTimes(1);

    await parentApi.close();
    expect(recreatedApi.store.state.isOpen).toBe(false);
  });

  it('binds the main drawer declared first in the same setup', async () => {
    const {
      getInnerApi,
      getMainApi,
      getSetupCount,
      onInnerConfirm,
      onMainConfirm,
      onOpenChange,
      parentApi,
    } = await mountSameSetupHarness();
    const mainApi = getMainApi();
    const innerApi = getInnerApi();

    expect(mainApi).toBeDefined();
    expect(innerApi).toBeDefined();
    if (!mainApi || !innerApi) return;
    expect(parentApi.store).toBe(mainApi.store);
    expect(parentApi.store).not.toBe(innerApi.store);
    expect(mainApi.store.state.title).toBe('Parent drawer title');
    expect(innerApi.store.state.title).not.toBe('Parent drawer title');

    const data = { id: 1 };
    parentApi.setData(data);
    expect(mainApi.getData()).toBe(data);
    expect(innerApi.getData()).toBeUndefined();

    parentApi.open();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(mainApi.store.state.isOpen).toBe(true);
    expect(innerApi.store.state.isOpen).toBe(false);

    innerApi.open();
    innerApi.onConfirm();
    await innerApi.close();
    innerApi.onClosed();
    await nextTick();
    expect(getSetupCount()).toBe(1);
    expect(onInnerConfirm).toHaveBeenCalledTimes(1);
    expect(onMainConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(mainApi.store.state.isOpen).toBe(true);

    parentApi.onConfirm();
    expect(onMainConfirm).toHaveBeenCalledTimes(1);
    expect(onInnerConfirm).toHaveBeenCalledTimes(1);

    // destroyOnClose 来自外部配置，只有主抽屉关闭后才会重建连接组件
    await parentApi.close();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    parentApi.onClosed();
    await nextTick();
    await nextTick();

    expect(getSetupCount()).toBe(2);
    const recreatedMainApi = getMainApi();
    const recreatedInnerApi = getInnerApi();
    expect(recreatedMainApi).toBeDefined();
    expect(recreatedInnerApi).toBeDefined();
    if (!recreatedMainApi || !recreatedInnerApi) return;
    expect(recreatedMainApi).not.toBe(mainApi);
    expect(recreatedMainApi.store.state.title).toBe('Parent drawer title');
    expect(parentApi.store).toBe(recreatedMainApi.store);
    expect(parentApi.store).not.toBe(recreatedInnerApi.store);

    parentApi.open();
    expect(recreatedMainApi.store.state.isOpen).toBe(true);
    expect(recreatedInnerApi.store.state.isOpen).toBe(false);
    parentApi.onConfirm();
    expect(onMainConfirm).toHaveBeenCalledTimes(2);
    expect(onInnerConfirm).toHaveBeenCalledTimes(1);
  });
});

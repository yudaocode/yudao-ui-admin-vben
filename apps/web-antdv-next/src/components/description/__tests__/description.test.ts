/* eslint-disable vue/one-component-per-file */

import type { App } from 'vue';

import type { DescriptionItemSchema } from '../typing';

import { createApp, h, nextTick, reactive } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import Description from '../description.vue';

vi.mock('antdv-next', async () => {
  const { defineComponent, h } =
    await vi.importActual<typeof import('vue')>('vue');
  return {
    Card: defineComponent({
      setup(_, { slots }) {
        return () => h('section', null, slots.default?.());
      },
    }),
    Descriptions: defineComponent({
      inheritAttrs: false,
      setup(_, { slots }) {
        return () => h('dl', { 'data-descriptions': '' }, slots.default?.());
      },
    }),
    DescriptionsItem: defineComponent({
      props: {
        label: { default: '', type: String },
        span: { default: undefined, type: Number },
      },
      setup(props, { slots }) {
        return () =>
          h('div', { 'data-desc-item': '' }, [
            h('dt', null, props.label),
            h('dd', null, slots.default?.()),
          ]);
      },
    }),
  };
});

const STACK = 'java.lang.NullPointerException\n\tat Demo.main(Demo.java:1)';

/** 模拟 API 错误日志详情，含大整数字符串编号及 0、false 字段 */
function createLog() {
  return {
    count: 0,
    enabled: false,
    exceptionStackTrace: STACK,
    id: '1234567890123456789',
    resultMsg: '',
  };
}

/** 创建描述项配置，回调均为 spy，便于断言是否被调用 */
function createSchema() {
  const showStack = vi.fn((data: any) => !!data.exceptionStackTrace);
  const renderStack = vi.fn((val: any) =>
    h('textarea', { readonly: true, value: val }),
  );
  const showEnabled = vi.fn((data: any) => data.enabled === false);
  const renderEnabled = vi.fn((val: any) => `enabled:${String(val)}`);
  const showResultMsg = vi.fn((data: any) => !!data.resultMsg);
  const schema: DescriptionItemSchema[] = [
    { field: 'id', label: '日志编号' },
    { field: 'count', label: '次数' },
    {
      field: 'enabled',
      label: '是否启用',
      render: renderEnabled,
      show: showEnabled,
    },
    {
      field: 'exceptionStackTrace',
      label: '异常堆栈',
      render: renderStack,
      show: showStack,
    },
    { field: 'resultMsg', label: '结果提示', show: showResultMsg },
    { field: 'custom', label: '自定义', slot: 'custom' },
  ];
  const callbacks = [
    showStack,
    renderStack,
    showEnabled,
    renderEnabled,
    showResultMsg,
  ];
  return { callbacks, renderStack, schema, showStack };
}

let app: App | undefined;
let host: HTMLElement | undefined;

/** 挂载描述组件，返回可修改的 data 状态及捕获的渲染错误 */
function mountDescription(
  schema: DescriptionItemSchema[],
  data?: Record<string, any>,
) {
  const state = reactive<{ data?: Record<string, any> }>({ data });
  const errors: unknown[] = [];
  const customSlot = vi.fn(({ data }: { data: any }) =>
    h('span', { 'data-slot': '' }, `slot:${data.id}`),
  );
  host = document.createElement('div');
  document.body.append(host);
  app = createApp({
    render: () =>
      h(Description, { data: state.data, schema }, { custom: customSlot }),
  });
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  app.mount(host);
  return { customSlot, errors, state };
}

/** 获得已渲染的描述项 */
function getItems() {
  return [...(host?.querySelectorAll('[data-desc-item]') ?? [])];
}

/** 按标签获得描述项内容 */
function getItemText(label: string) {
  const item = getItems().find(
    (el) => el.querySelector('dt')?.textContent === label,
  );
  return item?.querySelector('dd')?.textContent;
}

afterEach(() => {
  app?.unmount();
  app = undefined;
  host?.remove();
  host = undefined;
});

describe('description', () => {
  it('skips show, render and slot callbacks while data is empty', () => {
    const { callbacks, schema } = createSchema();
    const { customSlot, errors } = mountDescription(schema);

    expect(errors).toEqual([]);
    expect(host?.querySelector('[data-descriptions]')).not.toBeNull();
    expect(getItems()).toHaveLength(0);
    callbacks.forEach((fn) => expect(fn).not.toHaveBeenCalled());
    expect(customSlot).not.toHaveBeenCalled();
  });

  it('renders fields and conditional fields when data is present', () => {
    const { schema, showStack } = createSchema();
    const log = createLog();
    const { customSlot, errors } = mountDescription(schema, log);

    expect(errors).toEqual([]);
    expect(showStack).toHaveBeenCalledWith(log);
    expect(getItemText('日志编号')).toBe('1234567890123456789');
    expect(getItemText('次数')).toBe('0');
    expect(getItemText('是否启用')).toBe('enabled:false');
    expect(host?.querySelector('textarea')?.value).toBe(STACK);
    expect(getItemText('结果提示')).toBeUndefined();
    expect(getItemText('自定义')).toBe('slot:1234567890123456789');
    expect(customSlot).toHaveBeenCalled();
    expect(getItems()).toHaveLength(5);
  });

  it('clears rendered details without errors after data becomes empty', async () => {
    const { callbacks, schema } = createSchema();
    const { customSlot, errors, state } = mountDescription(schema, createLog());
    expect(getItems()).toHaveLength(5);
    const callCounts = callbacks.map((fn) => fn.mock.calls.length);
    const slotCallCount = customSlot.mock.calls.length;

    // 模拟弹窗关闭时先清空详情数据
    state.data = undefined;
    await nextTick();

    expect(errors).toEqual([]);
    expect(getItems()).toHaveLength(0);
    expect(host?.querySelector('textarea')).toBeNull();
    expect(host?.textContent).not.toContain('1234567890123456789');
    expect(callbacks.map((fn) => fn.mock.calls.length)).toEqual(callCounts);
    expect(customSlot.mock.calls.length).toBe(slotCallCount);

    // 再次打开时恢复展示
    state.data = createLog();
    await nextTick();

    expect(errors).toEqual([]);
    expect(getItems()).toHaveLength(5);
    expect(host?.querySelector('textarea')?.value).toBe(STACK);
  });
});

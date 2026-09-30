/* eslint-disable vue/one-component-per-file, vue/require-default-prop */

import { createApp, defineComponent, Fragment, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCategorySimpleList: vi.fn(),
  getProcessDefinitionList: vi.fn(),
  getProcessInstance: vi.fn(),
}));

vi.mock('#/api/bpm/category', () => ({
  getCategorySimpleList: mocks.getCategorySimpleList,
}));
vi.mock('#/api/bpm/definition', () => ({
  getProcessDefinitionList: mocks.getProcessDefinitionList,
  getProcessDefinition: vi.fn(),
}));
vi.mock('#/api/bpm/processInstance', () => ({
  getProcessInstance: mocks.getProcessInstance,
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}));
vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('main', slots.default?.());
    },
  }),
}));
vi.mock('../modules/form.vue', () => ({
  default: defineComponent({
    setup(_, { expose }) {
      expose({ initProcessInfo: vi.fn() });
      return () => h('div', 'form-detail');
    },
  }),
}));

vi.mock('antdv-next', () => {
  const TabPane = defineComponent({
    name: 'ATabPane',
    props: { tab: String },
    setup(props, { slots }) {
      return () => h('section', { 'data-tab': props.tab }, slots.default?.());
    },
  });

  const passthrough = (tag: string) =>
    defineComponent({
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        return () => h(tag, attrs, slots.default?.());
      },
    });

  const Card = defineComponent({
    inheritAttrs: false,
    setup(_, { slots }) {
      return () =>
        h('article', { 'data-testid': 'process-card' }, [
          slots.extra?.(),
          slots.default?.(),
          slots.actions?.(),
        ]);
    },
  });

  const InputSearch = defineComponent({
    props: { value: { type: String, default: '' } },
    emits: ['update:value', 'input', 'change', 'clear'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-testid': 'process-search',
          value: props.value,
          onInput: (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            // antdv-next forwards native input before its v-model update.
            emit('input', event);
            emit('update:value', value);
            emit('change', event);
          },
        });
    },
  });

  const Tabs = defineComponent({
    props: { activeKey: String },
    setup(props, { slots }) {
      return () => {
        const flatten = (nodes: any[]): any[] =>
          nodes.flatMap((node) =>
            node.type === Fragment && Array.isArray(node.children)
              ? flatten(node.children)
              : [node],
          );
        const panes = flatten(slots.default?.() ?? []).filter(
          (pane) => pane.type === TabPane,
        );
        return h(
          'div',
          {
            'data-testid': 'process-tabs',
            'data-active-key': props.activeKey,
          },
          panes.map((pane) => h(pane.type, pane.props, pane.children)),
        );
      };
    },
  });

  return {
    Card,
    Col: passthrough('div'),
    InputSearch,
    Row: passthrough('div'),
    Space: passthrough('div'),
    TabPane,
    Tabs,
    Tooltip: passthrough('span'),
    message: { error: vi.fn() },
  };
});

import CreatePage from '../index.vue';

const categories = [
  { code: 'sales', name: '销售流程' },
  { code: 'hr', name: '人事流程' },
];
const definitions = [
  { category: 'sales', id: '1', name: '合同审批' },
  { category: 'hr', id: '2', name: '请假审批' },
];

describe('bPM process instance create page', () => {
  let host: HTMLDivElement;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    mocks.getCategorySimpleList.mockResolvedValue(categories);
    mocks.getProcessDefinitionList.mockResolvedValue(definitions);
    mocks.getProcessInstance.mockResolvedValue(undefined);
    host = document.createElement('div');
    document.body.append(host);
    app = createApp(CreatePage);
    app.mount(host);
  });

  afterEach(() => {
    app.unmount();
    host.remove();
    vi.clearAllMocks();
  });

  it('renders category panes and cards after loading the API data', async () => {
    await vi.waitFor(() => {
      expect(host.textContent).toContain('合同审批');
      expect(host.textContent).toContain('请假审批');
    });

    expect(mocks.getProcessDefinitionList).toHaveBeenCalledWith({
      suspensionState: 1,
    });
    expect(host.querySelectorAll('[data-tab]').length).toBe(2);
    expect(
      host.querySelector('[data-testid="process-tabs"]')?.dataset.activeKey,
    ).toBe('sales');
  });

  it('keeps the matching category active when searching across categories', async () => {
    await vi.waitFor(() => expect(host.textContent).toContain('合同审批'));

    const input = host.querySelector(
      '[data-testid="process-search"]',
    ) as HTMLInputElement;
    input.value = '  请假  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(host.textContent).toContain('请假审批');
    expect(host.textContent).not.toContain('合同审批');
    expect(
      host.querySelector('[data-testid="process-tabs"]')?.dataset.activeKey,
    ).toBe('hr');
  });

  it('shows the empty state for no matches and restores the list when cleared', async () => {
    await vi.waitFor(() => expect(host.textContent).toContain('合同审批'));

    const input = host.querySelector(
      '[data-testid="process-search"]',
    ) as HTMLInputElement;
    input.value = '不存在的流程';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(host.textContent).toContain('没有找到搜索结果');

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(host.textContent).toContain('合同审批');
    expect(host.textContent).toContain('请假审批');
  });

  it('opens the form detail after selecting a process card', async () => {
    await vi.waitFor(() => expect(host.textContent).toContain('合同审批'));

    const card = host.querySelector('[data-tab] [data-testid="process-card"]');
    expect(card).not.toBeNull();
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(host.textContent).toContain('form-detail');
  });
});

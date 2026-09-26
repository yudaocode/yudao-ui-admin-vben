import type { App } from 'vue';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import VbenVxeGrid from '../use-vxe-grid.vue';

const grid = vi.hoisted(() => ({ props: {} as Record<string, any> }));

vi.mock('@vben/hooks', async () => {
  return import('../../../../../@core/composables/src/use-priority-value');
});
vi.mock('@vben/icons', () => ({ EmptyIcon: { render: () => null } }));
vi.mock('@vben/locales', () => ({ $t: (key: string) => key }));
vi.mock('@vben/preferences', () => ({
  usePreferences: () => ({ isMobile: ref(false) }),
}));
vi.mock('@vben-core/shadcn-ui', () => ({
  VbenHelpTooltip: { render: () => null },
  VbenLoading: { render: () => null },
}));
vi.mock('../init', () => ({
  useTableForm: () => [
    { render: () => null },
    { getState: () => ({}), setState: vi.fn() },
  ],
}));
vi.mock('vxe-pc-ui', () => ({ VxeButton: { render: () => null } }));
vi.mock('vxe-table', () => ({
  VxeGrid: defineComponent({
    inheritAttrs: false,
    props: {
      columns: { type: Array, default: undefined },
      toolbarConfig: { type: Object, default: undefined },
    },
    setup(props, { slots }) {
      grid.props = props;
      return () =>
        h('div', [
          slots['toolbar-actions']?.({}),
          slots['toolbar-tools']?.({}),
        ]);
    },
  }),
  VxeUI: { getConfig: () => ({}) },
}));

let activeApp: App | undefined;

async function mountGrid(slotName?: string) {
  const checkedIds = ref<number[]>([]);
  const gridOptions = ref({ columns: [{ field: 'id', title: '编号' }] });
  const tableTitle = ref('部门列表');
  const onDelete = vi.fn();
  const toolbarSlot = vi.fn(() =>
    h(
      'button',
      { disabled: checkedIds.value.length === 0, onClick: onDelete },
      `删除 (${checkedIds.value.length})`,
    ),
  );
  const host = document.createElement('div');
  document.body.append(host);
  const api = { setState: vi.fn() };
  activeApp = createApp(() =>
    h(
      VbenVxeGrid,
      {
        api: api as any,
        gridOptions: gridOptions.value,
        tableTitle: tableTitle.value,
      },
      slotName ? { [slotName]: toolbarSlot } : {},
    ),
  );
  activeApp.mount(host);
  await nextTick();
  await nextTick();
  return { checkedIds, gridOptions, host, onDelete, tableTitle, toolbarSlot };
}

afterEach(() => {
  activeApp?.unmount();
  activeApp = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('vben vxe grid toolbar', () => {
  it.each(['toolbar-actions', 'toolbar-tools', 'table-title'])(
    'updates %s without rebuilding grid configuration',
    async (slotName) => {
      const { checkedIds, host, onDelete } = await mountGrid(slotName);
      const columns = grid.props.columns;
      const toolbarConfig = grid.props.toolbarConfig;
      const button = host.querySelector('button')!;
      expect(button.disabled).toBe(true);

      checkedIds.value = [1];
      await nextTick();

      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('删除 (1)');
      expect(grid.props.columns).toBe(columns);
      expect(grid.props.toolbarConfig).toBe(toolbarConfig);
      button.click();
      expect(onDelete).toHaveBeenCalledOnce();

      checkedIds.value = [];
      await nextTick();
      expect(button.disabled).toBe(true);
      expect(grid.props.toolbarConfig).toBe(toolbarConfig);
    },
  );

  it('still updates explicit grid configuration', async () => {
    const { gridOptions } = await mountGrid('toolbar-tools');
    gridOptions.value = { columns: [{ field: 'name', title: '名称' }] };
    await nextTick();
    expect(grid.props.columns).toEqual([{ field: 'name', title: '名称' }]);
  });

  it('keeps the default title and hides an unused toolbar', async () => {
    const { host, tableTitle } = await mountGrid();
    expect(host.textContent).toContain('部门列表');
    tableTitle.value = '';
    await nextTick();
    expect(grid.props.toolbarConfig.enabled).toBe(false);
    tableTitle.value = '用户列表';
    await nextTick();
    expect(grid.props.toolbarConfig.slots.buttons).toBe('toolbar-actions');
    expect(host.textContent).toContain('用户列表');
  });
});

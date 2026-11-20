import { createApp, defineComponent, h, nextTick, reactive } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVbenVxeGrid } from '../use-vxe-grid';

// 不 mock '@vben/hooks':segmented 的 prop / state 切换必须走真实的
// usePriorityValues 与 Vue 响应式,并经 useVbenVxeGrid 的包装组件转发 prop。

const observedSectioned = vi.hoisted(() => [] as unknown[]);

vi.mock('@vben/preferences', async () => {
  const { ref } = await import('vue');
  const isMobile = ref(false);
  return { usePreferences: () => ({ isMobile }) };
});

vi.mock('@vben/icons', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    EmptyIcon: defineComponent(() => () => h('span')),
  };
});

vi.mock('@vben/locales', () => ({ $t: (key: string) => key }));

vi.mock('@vben-core/shadcn-ui', async () => {
  const { defineComponent, h } = await import('vue');
  const Stub = defineComponent(
    (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  );
  return { VbenHelpTooltip: Stub, VbenLoading: Stub };
});

vi.mock('vxe-pc-ui', async () => {
  const { defineComponent, h } = await import('vue');
  return { VxeButton: defineComponent(() => () => h('button')) };
});

// 只记录组件绑定到 VxeGrid 根节点上的分段标记
vi.mock('vxe-table', async () => {
  const { defineComponent, h } = await import('vue');

  return {
    VxeGrid: defineComponent({
      inheritAttrs: false,
      setup(_, { attrs }) {
        return () => {
          observedSectioned.push(attrs['data-vben-grid-sectioned']);
          return h('div');
        };
      },
    }),
    VxeUI: { getConfig: () => ({ grid: {} }) },
  };
});

vi.mock('../init', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    useTableForm: () => [
      defineComponent(() => () => h('form')),
      {
        getLatestSubmissionValues: vi.fn(() => ({})),
        getState: vi.fn(() => ({ compact: true })),
        getValues: vi.fn(async () => ({})),
        reset: vi.fn(),
        setLatestSubmissionValues: vi.fn(),
        setState: vi.fn(),
        unmount: vi.fn(),
      },
    ],
  };
});

vi.mock('../viewed-row', () => ({
  applyViewedRowOptions: vi.fn(),
  useViewedRow: vi.fn(),
}));

/**
 * 父组件以 reactive 对象整体透传(等价于模板中的 v-bind="bindings"),
 * 增删键会让父组件重新渲染,prop 的出现 / 消失经包装组件转发到内部 Grid
 */
function mountWithBindings(
  Grid: ReturnType<typeof useVbenVxeGrid>[0],
  bindings: Record<string, unknown>,
) {
  const Consumer = defineComponent({
    render: () => h(Grid, bindings as any),
  });
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(Consumer);
  app.mount(host);
  return { app, host };
}

async function flush() {
  await nextTick();
  await nextTick();
  await nextTick();
}

function currentSectioned() {
  return observedSectioned.at(-1);
}

describe('vben vxe grid segmented prop presence', () => {
  beforeEach(() => {
    observedSectioned.length = 0;
  });

  it('lets a later explicit false override the state, and falls back to the state when removed', async () => {
    const [Grid] = useVbenVxeGrid({ gridOptions: {}, segmented: 'card' });
    const bindings = reactive<Record<string, unknown>>({});
    const { app, host } = mountWithBindings(Grid, bindings);

    try {
      await flush();
      expect(currentSectioned()).toBe('card');

      bindings.segmented = false;
      await flush();
      expect(currentSectioned()).toBeUndefined();

      delete bindings.segmented;
      await flush();
      expect(currentSectioned()).toBe('card');
    } finally {
      app.unmount();
      host.remove();
    }
  });

  it('falls back to the state once an initial explicit false is removed', async () => {
    const [Grid, api] = useVbenVxeGrid({
      gridOptions: {},
      segmented: 'card',
    });
    const bindings = reactive<Record<string, unknown>>({ segmented: false });
    const { app, host } = mountWithBindings(Grid, bindings);

    try {
      await flush();
      expect(currentSectioned()).toBeUndefined();

      // prop 仍然存在时优先于 state
      api.setState({ segmented: 'zone' });
      await flush();
      expect(currentSectioned()).toBeUndefined();

      delete bindings.segmented;
      await flush();
      expect(currentSectioned()).toBe('zone');
    } finally {
      app.unmount();
      host.remove();
    }
  });

  it('follows prop value changes between card, zone and false', async () => {
    const [Grid] = useVbenVxeGrid({ gridOptions: {}, segmented: 'card' });
    const bindings = reactive<Record<string, unknown>>({ segmented: 'zone' });
    const { app, host } = mountWithBindings(Grid, bindings);

    try {
      await flush();
      expect(currentSectioned()).toBe('zone');

      bindings.segmented = 'card';
      await flush();
      expect(currentSectioned()).toBe('card');

      bindings.segmented = false;
      await flush();
      expect(currentSectioned()).toBeUndefined();

      bindings.segmented = 'zone';
      await flush();
      expect(currentSectioned()).toBe('zone');

      bindings.segmented = false;
      await flush();
      expect(currentSectioned()).toBeUndefined();

      bindings.segmented = 'card';
      await flush();
      expect(currentSectioned()).toBe('card');
    } finally {
      app.unmount();
      host.remove();
    }
  });
});

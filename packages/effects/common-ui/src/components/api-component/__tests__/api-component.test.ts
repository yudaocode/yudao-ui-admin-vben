import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, markRaw, nextTick, ref, shallowRef } from 'vue';

import { describe, expect, it } from 'vitest';

import ApiComponent from '../api-component.vue';

interface BindingScenario {
  name: string;
  /** ApiComponent 的 modelPropName，undefined 表示使用默认值 */
  modelPropName?: string;
  /** 内层组件声明的 v-model 属性名 */
  innerProp: string;
  /** 父级绑定到 ApiComponent 的 v-model 属性名 */
  outerProp: string;
}

const scenarios: BindingScenario[] = [
  {
    name: '默认：外层 modelValue + 内层 modelValue',
    innerProp: 'modelValue',
    outerProp: 'modelValue',
  },
  {
    name: 'kebab-case：modelPropName 为 model-value',
    modelPropName: 'model-value',
    innerProp: 'modelValue',
    outerProp: 'modelValue',
  },
  {
    name: '外层 modelValue + 内层 value（Antd/Antdv Next 表单映射）',
    modelPropName: 'value',
    innerProp: 'value',
    outerProp: 'modelValue',
  },
  {
    name: '外层 value + 内层 value（Naive/TDesign 及直接使用）',
    modelPropName: 'value',
    innerProp: 'value',
    outerProp: 'value',
  },
];

const options = [
  { label: 'one', value: 1 },
  { label: 'two', value: 2 },
];

function createModelInput(propName: string) {
  return markRaw(
    // eslint-disable-next-line vue/one-component-per-file -- 测试 fixture：被包装的内层组件
    defineComponent({
      name: 'ModelInput',
      props: {
        // 显式 default 避免含 Boolean 的类型在未传入时被转换为 false
        [propName]: {
          type: [String, Number, Boolean, Array],
          default: undefined,
        },
      },
      emits: [`update:${propName}`],
      setup() {
        return () => h('div');
      },
    }),
  );
}

function mountScenario(
  scenario: BindingScenario,
  initialValue: any,
  extraProps: Record<string, any> = {},
) {
  const outerValue = shallowRef<any>(initialValue);
  const updates: any[] = [];
  const apiRef = ref();
  const Input = createModelInput(scenario.innerProp);
  const wrapper = mount(
    // eslint-disable-next-line vue/one-component-per-file -- 测试 fixture：模拟父级 v-model 绑定
    defineComponent({
      setup() {
        return () =>
          h(ApiComponent, {
            component: Input,
            modelPropName: scenario.modelPropName,
            ref: apiRef,
            ...extraProps,
            [scenario.outerProp]: outerValue.value,
            [`onUpdate:${scenario.outerProp}`]: (value: any) => {
              updates.push(value);
              outerValue.value = value;
            },
          });
      },
    }),
  );
  const input = wrapper.findComponent(Input);
  return {
    outerValue,
    updates,
    wrapper,
    getInnerValue: () => input.props(scenario.innerProp),
    getValue: () => apiRef.value.getValue(),
    select: (value: any) =>
      input.vm.$emit(`update:${scenario.innerProp}`, value),
  };
}

const modelValues: any[] = ['selected', 0, false, ['a', 'b'], null, undefined];

describe('api-component.vue', () => {
  describe.each(scenarios)('$name', (scenario) => {
    it('初始化并将用户选择回写父级', async () => {
      const { getInnerValue, getValue, select, updates, wrapper } =
        mountScenario(scenario, 'initial');

      expect(getInnerValue()).toBe('initial');
      expect(getValue()).toBe('initial');

      for (const value of modelValues) {
        updates.length = 0;
        select(value);
        await nextTick();
        expect(updates).toHaveLength(1);
        expect(updates[0]).toStrictEqual(value);
        expect(getInnerValue()).toStrictEqual(value);
        expect(getValue()).toStrictEqual(value);
      }
      wrapper.unmount();
    });

    it('外部更新、编辑回填与清空同步到内层组件', async () => {
      const { getInnerValue, getValue, outerValue, updates, wrapper } =
        mountScenario(scenario, undefined);

      for (const value of ['edit', ...modelValues]) {
        outerValue.value = value;
        await nextTick();
        expect(getInnerValue()).toStrictEqual(value);
        expect(getValue()).toStrictEqual(value);
      }
      expect(updates).toEqual([]);
      wrapper.unmount();
    });

    it('当前模型为空时 autoSelect 回写父级', async () => {
      const { getInnerValue, getValue, updates, wrapper } = mountScenario(
        scenario,
        undefined,
        { api: () => Promise.resolve(options), autoSelect: 'first' },
      );

      await flushPromises();
      expect(updates).toEqual([1]);
      expect(getInnerValue()).toBe(1);
      expect(getValue()).toBe(1);
      wrapper.unmount();
    });

    it.each([0, false])(
      '当前模型为 %s 时 autoSelect 不覆盖',
      async (initialValue) => {
        const { getInnerValue, updates, wrapper } = mountScenario(
          scenario,
          initialValue,
          { api: () => Promise.resolve(options), autoSelect: 'first' },
        );

        await flushPromises();
        expect(updates).toEqual([]);
        expect(getInnerValue()).toBe(initialValue);
        wrapper.unmount();
      },
    );
  });

  describe('同时传入 value 与 modelValue（如 Naive/TDesign 表单）', () => {
    const scenario = scenarios[3]!;

    it.each(['custom', undefined, null, 0, false])(
      '显式传入的 value（%s）优先于 modelValue',
      async (customValue) => {
        const modelUpdates: any[] = [];
        const { getInnerValue, getValue, select, updates, wrapper } =
          mountScenario(scenario, customValue, {
            modelValue: 'model',
            'onUpdate:modelValue': (value: any) => modelUpdates.push(value),
          });

        expect(getInnerValue()).toStrictEqual(customValue);
        expect(getValue()).toStrictEqual(customValue);

        select('selected');
        await nextTick();
        expect(updates).toEqual(['selected']);
        expect(modelUpdates).toEqual([]);
        expect(getInnerValue()).toBe('selected');
        wrapper.unmount();
      },
    );

    it('value 为表单 emptyStateValue（null）时 autoSelect 只回写 update:value', async () => {
      const modelUpdates: any[] = [];
      const { getInnerValue, updates, wrapper } = mountScenario(
        scenario,
        null,
        {
          api: () => Promise.resolve(options),
          autoSelect: 'first',
          modelValue: undefined,
          'onUpdate:modelValue': (value: any) => modelUpdates.push(value),
        },
      );

      await flushPromises();
      expect(updates).toEqual([1]);
      expect(modelUpdates).toEqual([]);
      expect(getInnerValue()).toBe(1);
      wrapper.unmount();
    });
  });
});

<script lang="tsx">
import type { DescriptionsProps } from 'ant-design-vue/es/descriptions';

import type { CSSProperties, PropType, Slots } from 'vue';

import type { DescriptionItemSchema, DescriptionProps } from './typing';

import { computed, defineComponent, ref, toRefs, unref, useAttrs } from 'vue';

import { ContentWrap } from '@vben/common-ui';
import { get, isFunction } from '@vben/utils';

import { Descriptions } from 'ant-design-vue';

const props = {
  bordered: { default: true, type: Boolean },
  column: {
    default: () => {
      return { lg: 3, md: 3, sm: 2, xl: 3, xs: 1, xxl: 4 };
    },
    type: [Number, Object],
  },
  data: { type: Object },
  schema: {
    default: () => [],
    type: Array as PropType<DescriptionItemSchema[]>,
  },
  size: {
    default: 'small',
    type: String,
    validator: (v: string) =>
      ['default', 'middle', 'small', undefined].includes(v),
  },
  title: { default: '', type: String },
  useCard: { default: true, type: Boolean },
};

function getSlot(slots: Slots, slot: string, data?: any) {
  if (!slots || !Reflect.has(slots, slot)) {
    return null;
  }
  if (!isFunction(slots[slot])) {
    console.error(`${slot} is not a function!`);
    return null;
  }
  const slotFn = slots[slot];
  if (!slotFn) return null;
  return slotFn({ data });
}

export default defineComponent({
  name: 'Description',
  props,
  setup(props, { slots }) {
    const propsRef = ref<null | Partial<DescriptionProps>>(null);

    const prefixCls = 'description';
    const attrs = useAttrs();

    // Custom title component: get title
    const getMergeProps = computed(() => {
      return {
        ...props,
        ...(unref(propsRef) as any),
      } as DescriptionProps;
    });

    const getProps = computed(() => {
      const opt = {
        ...unref(getMergeProps),
        title: undefined,
      };
      return opt as DescriptionProps;
    });

    const useWrapper = computed(() => !!unref(getMergeProps).title);

    const getDescriptionsProps = computed(() => {
      return { ...unref(attrs), ...unref(getProps) } as DescriptionsProps;
    });

    // 防止换行
    function renderLabel({
      label,
      labelMinWidth,
      labelStyle,
    }: DescriptionItemSchema) {
      if (!labelStyle && !labelMinWidth) {
        return label;
      }

      const labelStyles: CSSProperties = {
        ...labelStyle,
        minWidth: `${labelMinWidth}px `,
      };
      return <div style={labelStyles}>{label}</div>;
    }

    function renderItem() {
      const { data, schema } = unref(getProps);
      return unref(schema)
        .map((item) => {
          const { contentMinWidth, field, render, show, span } = item;

          if (show && isFunction(show) && !show(data)) {
            return null;
          }

          function getContent() {
            const _data = unref(getProps)?.data;
            if (!_data) {
              return null;
            }
            const getField = get(_data, field);
            if (
              getField &&
              !Object.prototype.hasOwnProperty.call(toRefs(_data), field)
            ) {
              return isFunction(render) ? render!('', _data) : '';
            }
            return isFunction(render)
              ? render!(getField, _data)
              : (getField ?? '');
          }

          const width = contentMinWidth;
          return (
            <Descriptions.Item
              key={field}
              label={renderLabel(item)}
              span={span}
            >
              {() => {
                if (item.slot) {
                  const slotContent = getSlot(slots, item.slot, data);
                  return slotContent;
                }
                if (!contentMinWidth) {
                  return getContent();
                }
                const style: CSSProperties = {
                  minWidth: `${width}px`,
                };
                return <div style={style}>{getContent()}</div>;
              }}
            </Descriptions.Item>
          );
        })
        .filter((item) => !!item);
    }

    function renderDesc() {
      return (
        <Descriptions
          class={`${prefixCls}`}
          {...(unref(getDescriptionsProps) as any)}
        >
          {renderItem()}
        </Descriptions>
      );
    }

    function renderCard() {
      const content = props.useCard ? renderDesc() : <div>{renderDesc()}</div>;
      // Reduce the dom level
      if (!props.useCard) {
        return content;
      }

      const { title } = unref(getMergeProps);
      const extraSlot = getSlot(slots, 'extra');

      return (
        <ContentWrap
          class="text-base"
          headerClass={props.bordered ? 'p-4' : 'border-none p-4'}
        >
          {{
            default: () => content,
            title: () => (
              <div class="mb-2 flex w-full items-center justify-between text-base">
                <div>{title}</div>
                {extraSlot && <div>{extraSlot}</div>}
              </div>
            ),
          }}
        </ContentWrap>
      );
    }

    return () => (unref(useWrapper) ? renderCard() : renderDesc());
  },
});
</script>

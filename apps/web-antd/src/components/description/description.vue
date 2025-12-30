<script lang="tsx">
import type { DescriptionsProps } from 'ant-design-vue';

import type { PropType } from 'vue';

import type { DescriptionItemSchema, DescriptionsOptions } from './typing';

import { defineComponent, useSlots } from 'vue';

import { Descriptions, DescriptionsItem } from 'ant-design-vue';

/** 对 Descriptions 进行二次封装 */
const Description = defineComponent({
  name: 'Descriptions',
  props: {
    data: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    schema: {
      type: Array as PropType<DescriptionItemSchema[]>,
      default: () => [],
    },
    // Descriptions 原生 props
    componentProps: {
      type: Object as PropType<DescriptionsProps>,
      default: () => ({}),
    },
  },

  setup(props: DescriptionsOptions) {
    // TODO @puhui999：每个 field 的 slot 的考虑
    // TODO @puhui999：from 5.0：extra: () => getSlot(slots, 'extra')
    // 新增：获取插槽
    const slots = useSlots();
    /** 过滤掉不需要展示的 */
    const shouldShowItem = (item: DescriptionItemSchema) => {
      if (item.hidden === undefined) return true;
      return typeof item.hidden === 'function'
        ? !item.hidden(props.data)
        : !item.hidden;
    };
    /** 渲染内容（新增 Slot 支持） */
    const renderContent = (item: DescriptionItemSchema) => {
      // 1. 优先使用字段级 Slot：field-${fieldName}
      const fieldSlotName = `field-${item.field}`;
      if (item.field && slots[fieldSlotName]) {
        // 传递作用域参数：value、record、field、label
        return slots[fieldSlotName]?.({
          value: props.data?.[item.field],
          record: props.data,
          field: item.field,
          label: item.label,
        });
      }

      if (item.content) {
        return typeof item.content === 'function'
          ? item.content(props.data)
          : item.content;
      }
      return item.field ? props.data?.[item.field] : null;
    };

    return () => (
      <Descriptions
        {...props.componentProps} // 修正：只透传 componentProps（原代码透传 props 会冗余）
        bordered={props.componentProps?.bordered}
        colon={props.componentProps?.colon}
        column={props.componentProps?.column}
        extra={props.componentProps?.extra}
        layout={props.componentProps?.layout}
        size={props.componentProps?.size}
        title={props.componentProps?.title}
      >
        {props.schema?.filter(shouldShowItem).map((item) => (
          <DescriptionsItem
            contentStyle={item.contentStyle}
            key={item.field || String(item.label)}
            label={item.label}
            labelStyle={item.labelStyle}
            span={item.span}
          >
            {renderContent(item)}
          </DescriptionsItem>
        ))}
      </Descriptions>
    );
  },
});

// TODO @puhui999：from 5.0：emits: ['register'] 事件
export default Description;
</script>

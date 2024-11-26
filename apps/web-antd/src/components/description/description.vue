<script setup lang="ts">
import type { DescItem } from './types';

import type { PropType } from 'vue';

import { Descriptions, DescriptionsItem } from 'ant-design-vue';

import { componentMap } from '#/components/view/component-map';

defineProps({
  title: { type: String, default: '' },
  bordered: { type: Boolean, default: true },
  size: {
    type: String as PropType<'default' | 'middle' | 'small'>,
    default: undefined,
  },
  column: {
    type: [Number, Object],
    default: () => {
      // return { xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 };
      return 12;
    },
  },
  labelStyle: {
    type: Object,
    default() {
      return {
        width: '120px',
      };
    },
  },
  contentStyle: {
    type: Object,
    default() {
      return {
        width: '0px',
      };
    },
  },
  schema: {
    type: Array as PropType<DescItem[]>,
    default: () => [],
  },
  data: { type: Object, default: undefined },
});
</script>
<template>
  <Descriptions
    :bordered="bordered"
    :column="column"
    :content-style="contentStyle"
    :label-style="labelStyle"
    :size="size"
    :title="title ? title : undefined"
  >
    <template v-for="item in schema" :key="item.field">
      <DescriptionsItem :label="item.label" :span="item.span">
        <component
          :is="(componentMap as Map<String, any>).get(item.component)"
          v-if="(componentMap as Map<String, any>).has(item.component)"
          :value="data?.[item.field]"
          v-bind="{ ...item.componentProps }"
        />
        <component
          :is="item.render(data?.[item.field], data)"
          v-else-if="
            !(componentMap as Map<String, any>).has(item.component) &&
            item.render
          "
          :value="data?.[item.field]"
          v-bind="{ ...item.componentProps }"
        />
        <template v-else>{{ data?.[item.field] }}</template>
      </DescriptionsItem>
    </template>
  </Descriptions>
</template>

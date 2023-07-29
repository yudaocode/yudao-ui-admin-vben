<script lang="ts" setup>
import { computed } from 'vue'

import { Select } from 'ant-design-vue'
import { baseHandler } from '../handler'
import type { HandlerEnum } from '../enum'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'SelectItem' })

const props = defineProps({
  event: {
    type: Number as PropType<HandlerEnum>,
  },
  disabled: {
    type: Boolean,
  },
  title: {
    type: String,
  },
  def: {
    type: [String, Number] as PropType<string | number>,
  },
  initValue: {
    type: [String, Number] as PropType<string | number>,
  },
  options: {
    type: Array as PropType<LabelValueOptions>,
    default: () => [],
  },
})
const { prefixCls } = useDesign('setting-select-item')
const getBindValue = computed(() => {
  return props.def ? { value: props.def, defaultValue: props.initValue || props.def } : {}
})

function handleChange(e: ChangeEvent) {
  props.event && baseHandler(props.event, e)
}
</script>

<template>
  <div :class="prefixCls">
    <span> {{ title }}</span>
    <Select v-bind="getBindValue" :class="`${prefixCls}-select`" :disabled="disabled" :options="options" @change="handleChange as any" />
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-setting-select-item';

.@{prefix-cls} {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;

  &-select {
    width: 126px;
  }
}
</style>

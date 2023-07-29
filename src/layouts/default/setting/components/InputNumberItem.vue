<script lang="ts" setup>
import { InputNumber } from 'ant-design-vue'
import { baseHandler } from '../handler'
import type { HandlerEnum } from '../enum'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'InputNumberItem' })

const props = defineProps({
  event: {
    type: Number as PropType<HandlerEnum>,
  },
  title: {
    type: String,
  },
})
const { prefixCls } = useDesign('setting-input-number-item')

function handleChange(e) {
  props.event && baseHandler(props.event, e)
}
</script>

<template>
  <div :class="prefixCls">
    <span> {{ title }}</span>
    <InputNumber v-bind="$attrs" :class="`${prefixCls}-input-number`" @change="handleChange" />
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-setting-input-number-item';

.@{prefix-cls} {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;

  &-input-number {
    width: 126px !important;
  }
}
</style>

<script lang="ts" setup>
import { InputNumber } from 'ant-design-vue'
import { baseHandler } from '../handler'
import type { HandlerEnum } from '../enum'

defineOptions({ name: 'InputNumberItem' })

const props = defineProps({
  event: {
    type: Number as PropType<HandlerEnum>,
  },
  title: {
    type: String,
  },
})

function handleChange(e) {
  props.event && baseHandler(props.event, e)
}
</script>

<template>
  <div class="my-4 flex justify-between">
    <span> {{ title }}</span>
    <InputNumber v-bind="$attrs" class="max-w-32 w-30" @change="handleChange" />
  </div>
</template>

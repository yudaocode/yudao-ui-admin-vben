<script lang="ts" setup>
import { computed } from 'vue'

import { Select } from 'ant-design-vue'
import { baseHandler } from '../handler'
import type { HandlerEnum } from '../enum'

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
const getBindValue = computed(() => {
  return props.def ? { value: props.def, defaultValue: props.initValue || props.def } : {}
})

function handleChange(e) {
  props.event && baseHandler(props.event, e)
}
</script>

<template>
  <div class="my-4 flex justify-between">
    <span> {{ title }}</span>
    <Select v-bind="getBindValue" class="max-w-32 w-30" :disabled="disabled" :options="options" @change="handleChange" />
  </div>
</template>

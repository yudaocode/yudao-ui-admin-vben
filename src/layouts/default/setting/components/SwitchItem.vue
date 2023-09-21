<script lang="ts" setup>
import { computed } from 'vue'

import { Switch } from 'ant-design-vue'
import { baseHandler } from '../handler'
import type { HandlerEnum } from '../enum'
import { useI18n } from '@/hooks/web/useI18n'

defineOptions({ name: 'SwitchItem' })

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
    type: Boolean,
  },
})
const { t } = useI18n()

const getBindValue = computed(() => {
  return props.def ? { checked: props.def } : {}
})
function handleChange(e) {
  props.event && baseHandler(props.event, e)
}
</script>

<template>
  <div class="my-4 flex justify-between">
    <span> {{ title }}</span>
    <Switch
      v-bind="getBindValue"
      :disabled="disabled"
      :checked-children="t('layout.setting.on')"
      :un-checked-children="t('layout.setting.off')"
      @change="handleChange"
    />
  </div>
</template>

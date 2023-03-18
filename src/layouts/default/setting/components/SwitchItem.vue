<template>
  <div :class="prefixCls">
    <span> {{ title }}</span>
    <Switch
      v-bind="getBindValue"
      @change="handleChange as any"
      :disabled="disabled"
      :checkedChildren="t('layout.setting.on')"
      :unCheckedChildren="t('layout.setting.off')"
    />
  </div>
</template>
<script lang="ts" setup name="SwitchItem">
import { computed } from 'vue'

import { Switch } from 'ant-design-vue'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'
import { baseHandler } from '../handler'
import { HandlerEnum } from '../enum'

const props = defineProps({
  event: {
    type: Number as PropType<HandlerEnum>
  },
  disabled: {
    type: Boolean
  },
  title: {
    type: String
  },
  def: {
    type: Boolean
  }
})
const { prefixCls } = useDesign('setting-switch-item')
const { t } = useI18n()

const getBindValue = computed(() => {
  return props.def ? { checked: props.def } : {}
})
function handleChange(e: ChangeEvent) {
  props.event && baseHandler(props.event, e)
}
</script>
<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-setting-switch-item';

.@{prefix-cls} {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
}
</style>

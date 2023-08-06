<script lang="ts" setup>
import { Button } from 'ant-design-vue'
import { computed, unref } from 'vue'
import { buttonProps } from './props'
import { Icon } from '@/components/Icon'
import { useAttrs } from '@/hooks/core/useAttrs'

defineOptions({ name: 'AButton', extends: Button, indeterminate: false })

const props = defineProps(buttonProps)
// get component class
const attrs = useAttrs({ excludeDefaultKeys: false })
const getButtonClass = computed(() => {
  const { color, disabled } = props
  return [
    {
      [`ant-btn-${color}`]: !!color,
      'is-disabled': disabled,
    },
  ]
})

// get inherit binding value
const getBindValue = computed(() => ({ ...unref(attrs), ...props }))
</script>

<template>
  <Button v-bind="getBindValue" :class="getButtonClass" @click="onClick">
    <template #default="data">
      <Icon v-if="preIcon" :icon="preIcon" :size="iconSize" />
      <slot v-bind="data || {}" />
      <Icon v-if="postIcon" :icon="postIcon" :size="iconSize" />
    </template>
  </Button>
</template>
